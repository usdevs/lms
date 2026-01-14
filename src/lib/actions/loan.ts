"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { CreateLoanSchema, ReturnItemSchema } from "@/lib/schema/loan";

export interface CreateLoanResult {
    success: boolean;
    error?: string;
    errors?: Record<string, string[]>;
}

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
            // Resolve Requester
            let finalReqId = requesterId;

            if (!finalReqId && newRequester) {

                const existing = await tx.requester.findUnique({ where: { reqNusnet: newRequester.nusnet } });
                if (existing) {
                    throw new Error(`Requester with NUSNET ${newRequester.nusnet} already exists.`);
                }

                const created = await tx.requester.create({
                    data: {
                        reqName: newRequester.name,
                        reqNusnet: newRequester.nusnet,
                        reqTelehandle: newRequester.telehandle || null,
                    }
                });
                finalReqId = created.reqId;
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
                    requestStatus: "PENDING",
                }
            });

            // Create LoanItemDetails (no stock deduction until approval)
            for (const loanItem of items) {
                const dbItem = await tx.item.findUnique({ where: { itemId: loanItem.itemId } });
                if (!dbItem) throw new Error(`Item ${loanItem.itemId} not found`);

                // Prevent overbooking: check pending requests
                const pendingAgg = await tx.loanItemDetail.aggregate({
                    where: {
                        itemId: loanItem.itemId,
                        loanStatus: "PENDING"
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
                        loanStatus: "PENDING",
                        itemSlocAtLoan: dbItem.itemSloc,
                        itemIhAtLoan: dbItem.itemIh,
                    }
                });
            }
        });

        revalidatePath("/loans");
        return { success: true };

    } catch (e: any) {
        console.error("Failed to create loan:", e);
        return { success: false, error: e.message || "Failed to create loan" };
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
            if (request.requestStatus !== "PENDING") throw new Error("Loan is not pending");

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
                    data: { loanStatus: "ON_LOAN" }
                });
            }

            await tx.loanRequest.update({
                where: { refNo },
                data: { requestStatus: "ONGOING" }
            });
        });

        revalidatePath("/loans");
        revalidatePath("/catalogue");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function rejectLoan(refNo: number) {
    try {
        await prisma.$transaction(async (tx) => {
            const request = await tx.loanRequest.findUnique({ where: { refNo } });
            if (!request) throw new Error("Loan request not found");
            if (request.requestStatus !== "PENDING") throw new Error("Loan is not pending");


            await tx.loanRequest.update({
                where: { refNo },
                data: { requestStatus: "REJECTED" }
            });

            await tx.loanItemDetail.updateMany({
                where: { refNo },
                data: { loanStatus: "REJECTED" }
            });
        });

        revalidatePath("/loans");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function returnItem(loanDetailId: number) {
    try {
        await prisma.$transaction(async (tx) => {

            const detail = await tx.loanItemDetail.findUnique({
                where: { loanDetailId },
                include: { loanRequest: true }
            });

            if (!detail) throw new Error("Loan detail not found");
            if (["RETURNED", "RETURNED_LATE"].includes(detail.loanStatus)) return; // Already returned

            // Check for late return
            const isLate = new Date() > detail.loanRequest.loanDateEnd;
            const newStatus = isLate ? "RETURNED_LATE" : "RETURNED";


            await tx.loanItemDetail.update({
                where: { loanDetailId },
                data: { loanStatus: newStatus }
            });

            // Restore stock
            await tx.item.update({
                where: { itemId: detail.itemId },
                data: { itemQty: { increment: detail.loanQty } }
            });

            // Mark loan as COMPLETED if all items returned
            const siblings = await tx.loanItemDetail.findMany({
                where: { refNo: detail.refNo }
            });

            const allReturned = siblings.every(s =>
                s.loanDetailId === loanDetailId || ["RETURNED", "RETURNED_LATE", "REJECTED"].includes(s.loanStatus)
            );

            if (allReturned) {
                await tx.loanRequest.update({
                    where: { refNo: detail.refNo },
                    data: { requestStatus: "COMPLETED" }
                });
            }
        });

        revalidatePath("/loans");
        revalidatePath("/catalogue");
        return { success: true };
    } catch (e: any) {
        console.error("Return item error:", e);
        return { success: false, error: e.message };
    }
}

export async function getLoans() {

    const loans = await prisma.loanRequest.findMany({
        include: {
            requester: true,
            loanDetails: {
                include: {
                    item: true
                }
            }
        },
        orderBy: { refNo: 'desc' }
    });
    return loans;
}
