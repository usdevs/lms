"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LoanItemStatus, LoanRequestStatus, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { CreateLoanSchema } from "@/lib/schema/loan";
import { CreateLoanResult } from "../types/loans";

export async function createLoan(data: z.infer<typeof CreateLoanSchema>): Promise<CreateLoanResult> {
    const parseResult = CreateLoanSchema.safeParse(data);
    if (!parseResult.success) {
        return {
            success: false,
            error: "Validation failed",
            errors: parseResult.error.flatten().fieldErrors,
        };
    }

    const {
        items,
        requesterId,
        newRequester,
        loanDateStart,
        loanDateEnd,
        organisation,
        eventDetails,
        eventLocation
    } = parseResult.data;

    try {
        await prisma.$transaction(async (tx) => {
            // Resolve Requester (User)
            let finalReqId = requesterId;

            if (!finalReqId && newRequester) {
                // Normalize telegram handle: remove @ if present and convert to lowercase
                const normalizedHandle = newRequester.telegramHandle.startsWith("@") 
                    ? newRequester.telegramHandle.slice(1).toLowerCase()
                    : newRequester.telegramHandle.toLowerCase();

                // Check if user with this telegram handle already exists
                const existingByTelegram = await tx.user.findUnique({ where: { telegramHandle: normalizedHandle } });
                if (existingByTelegram) {
                    throw new Error(`User with Telegram handle @${normalizedHandle} already exists.`);
                }

                // Check if user with this NUSNET ID already exists (if provided)
                if (newRequester.nusnet) {
                    const existingByNusnet = await tx.user.findUnique({ where: { nusnetId: newRequester.nusnet } });
                    if (existingByNusnet) {
                        throw new Error(`User with NUSNET ${newRequester.nusnet} already exists.`);
                    }
                }

                const created = await tx.user.create({
                    data: {
                        firstName: newRequester.firstName,
                        lastName: newRequester.lastName || null,
                        nusnetId: newRequester.nusnet || null,
                        telegramHandle: normalizedHandle,
                        role: newRequester.role || UserRole.REQUESTER, // Default to REQUESTER if not provided
                    }
                });
                finalReqId = created.userId;
            }

            if (!finalReqId) throw new Error("Requester not identified");


            // Create LoanRequest
            const loanRequest = await tx.loanRequest.create({
                data: {
                    reqId: finalReqId,
                    loanDateStart: loanDateStart,
                    loanDateEnd: loanDateEnd,
                    organisation: organisation || null,
                    eventDetails: eventDetails || null,
                    eventLocation: eventLocation || null,
                    loanRequestStatus: LoanRequestStatus.PENDING,
                }
            });

            // Create LoanItemDetails (no stock deduction until approval)
            for (const loanItem of items) {
                const dbItem = await tx.item.findUnique({ where: { itemId: loanItem.itemId } });
                if (!dbItem) throw new Error(`Item ${loanItem.itemId} not found`);

                // Check if item is unloanable
                if (dbItem.itemUnloanable) {
                    throw new Error(`${dbItem.itemDesc} is marked as unloanable and cannot be loaned out`);
                }

                // Prevent overbooking: check pending requests
                const pendingAgg = await tx.loanItemDetail.aggregate({
                    where: {
                        itemId: loanItem.itemId,
                        loanItemStatus: LoanItemStatus.PENDING
                    },
                    _sum: {
                        loanQty: true
                    }
                });

                const currentPending = pendingAgg._sum.loanQty || 0;
                const netAvailable = dbItem.itemQty - currentPending;

                if (loanItem.loanQty > netAvailable) {
                    throw new Error(`Insufficient allocatable stock for ${dbItem.itemDesc}. Available: ${dbItem.itemQty}, Pending: ${currentPending}, Net: ${netAvailable}. Requested: ${loanItem.loanQty}`);
                }


                await tx.loanItemDetail.create({
                    data: {
                        refNo: loanRequest.refNo,
                        itemId: loanItem.itemId,
                        loanQty: loanItem.loanQty,
                        loanItemStatus: LoanItemStatus.PENDING,
                    }
                });
            }
        });

        revalidatePath("/loans");
        return { success: true };

    } catch (e) {
        console.error("Failed to create loan:", e);
        const message = e instanceof Error ? e.message : "Failed to create loan";
        return { success: false, error: message };
    }
}

export async function approveLoan(refNo: number) {
    try {
        await prisma.$transaction(async (tx) => {
            const request = await tx.loanRequest.findUnique({
                where: { refNo },
                include: { loanDetails: { include: { item: true } } }
            });

            if (!request) throw new Error("Loan request not found");
            if (request.loanRequestStatus !== LoanRequestStatus.PENDING) throw new Error("Loan is not pending");

            // Deduct stock for each item
            for (const detail of request.loanDetails) {
                if (detail.item.itemQty < detail.loanQty) {
                    throw new Error(`Insufficient stock for ${detail.item.itemDesc}. Available: ${detail.item.itemQty}, Requested: ${detail.loanQty}`);
                }

                await tx.item.update({
                    where: { itemId: detail.itemId },
                    data: { itemQty: { decrement: detail.loanQty } }
                });

                await tx.loanItemDetail.update({
                    where: { loanDetailId: detail.loanDetailId },
                    data: { loanItemStatus: LoanItemStatus.ON_LOAN }
                });
            }

            await tx.loanRequest.update({
                where: { refNo },
                data: { loanRequestStatus: LoanRequestStatus.ONGOING }
            });
        });

        revalidatePath("/loans");
        revalidatePath("/catalogue");
        return { success: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to approve loan";
        return { success: false, error: message };
    }
}

export async function rejectLoan(refNo: number) {
    try {
        await prisma.$transaction(async (tx) => {
            const request = await tx.loanRequest.findUnique({ where: { refNo } });
            if (!request) throw new Error("Loan request not found");
            if (request.loanRequestStatus !== LoanRequestStatus.PENDING) throw new Error("Loan is not pending");


            await tx.loanRequest.update({
                where: { refNo },
                data: { loanRequestStatus: LoanRequestStatus.REJECTED }
            });

            await tx.loanItemDetail.updateMany({
                where: { refNo },
                data: { loanItemStatus: LoanItemStatus.REJECTED }
            });
        });

        revalidatePath("/loans");
        return { success: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to reject loan";
        return { success: false, error: message };
    }
}

/**
 * Update a pending loan request
 * Only allowed for PENDING loans (pre-approval)
 */
export async function updateLoan(refNo: number, data: {
    loanDateStart: Date;
    loanDateEnd: Date;
    organisation?: string;
    eventDetails?: string;
    eventLocation?: string;
    items: { itemId: number; loanQty: number }[];
}) {
    try {
        await prisma.$transaction(async (tx) => {
            const request = await tx.loanRequest.findUnique({
                where: { refNo },
                include: { loanDetails: true }
            });

            if (!request) throw new Error("Loan request not found");
            if (request.loanRequestStatus !== LoanRequestStatus.PENDING) {
                throw new Error("Can only edit pending loans");
            }

            // Update loan request details
            await tx.loanRequest.update({
                where: { refNo },
                data: {
                    loanDateStart: data.loanDateStart,
                    loanDateEnd: data.loanDateEnd,
                    organisation: data.organisation || null,
                    eventDetails: data.eventDetails || null,
                    eventLocation: data.eventLocation || null,
                }
            });

            // Delete existing loan item details
            await tx.loanItemDetail.deleteMany({
                where: { refNo }
            });

            // Create new loan item details
            for (const loanItem of data.items) {
                const dbItem = await tx.item.findUnique({ where: { itemId: loanItem.itemId } });
                if (!dbItem) throw new Error(`Item ${loanItem.itemId} not found`);

                // Check if item is unloanable
                if (dbItem.itemUnloanable) {
                    throw new Error(`${dbItem.itemDesc} is marked as unloanable and cannot be loaned out`);
                }

                // Check available stock (excluding this loan's previous pending items)
                const pendingAgg = await tx.loanItemDetail.aggregate({
                    where: {
                        itemId: loanItem.itemId,
                        loanItemStatus: LoanItemStatus.PENDING,
                        refNo: { not: refNo }
                    },
                    _sum: { loanQty: true }
                });

                const currentPending = pendingAgg._sum.loanQty || 0;
                const netAvailable = dbItem.itemQty - currentPending;

                if (loanItem.loanQty > netAvailable) {
                    throw new Error(`Insufficient allocatable stock for ${dbItem.itemDesc}. Available: ${dbItem.itemQty}, Pending: ${currentPending}, Net: ${netAvailable}. Requested: ${loanItem.loanQty}`);
                }

                await tx.loanItemDetail.create({
                    data: {
                        refNo,
                        itemId: loanItem.itemId,
                        loanQty: loanItem.loanQty,
                        loanItemStatus: LoanItemStatus.PENDING,
                    }
                });
            }
        });

        revalidatePath("/loans");
        return { success: true };
    } catch (e) {
        console.error("Failed to update loan:", e);
        const message = e instanceof Error ? e.message : "Failed to update loan";
        return { success: false, error: message };
    }
}

/**
 * Delete a pending loan request
 * Only allowed for PENDING loans (pre-approval)
 */
export async function deleteLoan(refNo: number) {
    try {
        await prisma.$transaction(async (tx) => {
            const request = await tx.loanRequest.findUnique({
                where: { refNo }
            });

            if (!request) throw new Error("Loan request not found");
            if (request.loanRequestStatus !== LoanRequestStatus.PENDING) {
                throw new Error("Can only delete pending loans");
            }

            // Delete loan item details first (cascade should handle this, but being explicit)
            await tx.loanItemDetail.deleteMany({
                where: { refNo }
            });

            // Delete the loan request
            await tx.loanRequest.delete({
                where: { refNo }
            });
        });

        revalidatePath("/loans");
        return { success: true };
    } catch (e) {
        console.error("Failed to delete loan:", e);
        const message = e instanceof Error ? e.message : "Failed to delete loan";
        return { success: false, error: message };
    }
}

export async function returnItem(loanDetailId: number) {
    try {
        const result = await prisma.$transaction(async (tx) => {

            const detail = await tx.loanItemDetail.findUnique({
                where: { loanDetailId },
                include: { loanRequest: true, item: true }
            });

            if (!detail) throw new Error("Loan detail not found");
            
            // Only items that are ON_LOAN can be returned
            if (detail.loanItemStatus !== LoanItemStatus.ON_LOAN) {
                if (detail.loanItemStatus === LoanItemStatus.RETURNED || detail.loanItemStatus === LoanItemStatus.RETURNED_LATE) {
                    return { alreadyReturned: true };
                }
                throw new Error("Item is not currently on loan");
            }

            // Check for late return
            const isLate = new Date() > detail.loanRequest.loanDateEnd;
            const newStatus = isLate ? LoanItemStatus.RETURNED_LATE : LoanItemStatus.RETURNED;


            await tx.loanItemDetail.update({
                where: { loanDetailId },
                data: { loanItemStatus: newStatus }
            });

            // Restore stock only if item is NOT expendable
            // Expendable items are consumed and should not be returned to inventory
            if (!detail.item.itemExpendable) {
                await tx.item.update({
                    where: { itemId: detail.itemId },
                    data: { itemQty: { increment: detail.loanQty } }
                });
            }

            // Mark loan as COMPLETED if all items returned
            const siblings = await tx.loanItemDetail.findMany({
                where: { refNo: detail.refNo }
            });

            const allReturned = siblings.every(s =>
                s.loanDetailId === loanDetailId || 
                s.loanItemStatus === LoanItemStatus.RETURNED || 
                s.loanItemStatus === LoanItemStatus.RETURNED_LATE || 
                s.loanItemStatus === LoanItemStatus.REJECTED
            );

            if (allReturned) {
                await tx.loanRequest.update({
                    where: { refNo: detail.refNo },
                    data: { loanRequestStatus: LoanRequestStatus.COMPLETED }
                });
            }

            return { newStatus };
        });

        // Handle already returned case
        if (result.alreadyReturned) {
            return { success: true, message: "Item was already returned" };
        }

        revalidatePath("/loans");
        revalidatePath("/catalogue");
        return { success: true, status: result.newStatus };
    } catch (e) {
        console.error("Return item error:", e);
        const message = e instanceof Error ? e.message : "Failed to return item";
        return { success: false, error: message };
    }
}

