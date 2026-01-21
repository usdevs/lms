"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { IH, IHType, User, UserRole } from "@prisma/client";
import prisma from "@/lib/prisma";
import { CreateUserWithGroupsSchema, UpdateUserSchema, CreateGroupIHSchema } from "@/lib/schema/user";
import { ActionResult } from "../types/actionResult";
import { getSession } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/rbac";

/**
 * Helper to check if the current user has permission to manage users
 */
async function requireAdminAuth(): Promise<{ authorized: true } | { authorized: false; error: string }> {
    const session = await getSession();
    if (!session) {
        return { authorized: false, error: "Authentication required" };
    }
    if (!canManageUsers(session.user.role)) {
        return { authorized: false, error: "Admin access required" };
    }
    return { authorized: true };
}

/**
 * Create a new user with optional group memberships
 * Requires ADMIN role
 */
export async function createUser(data: z.infer<typeof CreateUserWithGroupsSchema>): Promise<ActionResult<User>> {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return { success: false, error: auth.error };
    }

    const parseResult = CreateUserWithGroupsSchema.safeParse(data);
    if (!parseResult.success) {
        return {
            success: false,
            error: "Validation failed",
        };
    }

    const { firstName, lastName, nusnet, telegramHandle, role, groupIds } = parseResult.data;

    try {
        // Normalize telegram handle
        const normalizedHandle = telegramHandle.startsWith("@")
            ? telegramHandle.slice(1).toLowerCase()
            : telegramHandle.toLowerCase();

        // Check for existing telegram handle
        const existingByTelegram = await prisma.user.findUnique({
            where: { telegramHandle: normalizedHandle },
        });
        if (existingByTelegram) {
            return { success: false, error: `User with Telegram handle @${normalizedHandle} already exists.` };
        }

        // Check for existing NUSNET if provided
        if (nusnet) {
            const existingByNusnet = await prisma.user.findUnique({
                where: { nusnetId: nusnet },
            });
            if (existingByNusnet) {
                return { success: false, error: `User with NUSNET ${nusnet} already exists.` };
            }
        }

        // Create user with group memberships in a transaction
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    firstName,
                    lastName: lastName || null,
                    nusnetId: nusnet || null,
                    telegramHandle: normalizedHandle,
                    role: role || UserRole.REQUESTER,
                },
            });

            // Create group memberships if provided
            if (groupIds && groupIds.length > 0) {
                await tx.iHMember.createMany({
                    data: groupIds.map((ihId) => ({
                        userId: newUser.userId,
                        ihId,
                        isPrimary: false,
                    })),
                });
            }

            return newUser;
        });

        revalidatePath("/users");
        return { success: true, data: user };
    } catch (e) {
        console.error("Failed to create user:", e);
        const message = e instanceof Error ? e.message : "Failed to create user";
        return { success: false, error: message };
    }
}

/**
 * Update a user's details and group memberships
 * Requires ADMIN role
 */
export async function updateUser(data: z.infer<typeof UpdateUserSchema>): Promise<ActionResult> {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return { success: false, error: auth.error };
    }

    const parseResult = UpdateUserSchema.safeParse(data);
    if (!parseResult.success) {
        return { success: false, error: "Validation failed" };
    }

    const { userId, firstName, lastName, nusnet, telegramHandle, role, groupIds } = parseResult.data;

    try {
        const normalizedHandle = telegramHandle.startsWith("@")
            ? telegramHandle.slice(1).toLowerCase()
            : telegramHandle.toLowerCase();

        // Check for existing telegram handle (excluding current user)
        const existingByTelegram = await prisma.user.findFirst({
            where: {
                telegramHandle: normalizedHandle,
                NOT: { userId },
            },
        });
        if (existingByTelegram) {
            return { success: false, error: `User with Telegram handle @${normalizedHandle} already exists.` };
        }

        // Check for existing NUSNET if provided (excluding current user)
        if (nusnet) {
            const existingByNusnet = await prisma.user.findFirst({
                where: {
                    nusnetId: nusnet,
                    NOT: { userId },
                },
            });
            if (existingByNusnet) {
                return { success: false, error: `User with NUSNET ${nusnet} already exists.` };
            }
        }

        await prisma.$transaction(async (tx) => {
            // Update user details
            await tx.user.update({
                where: { userId },
                data: {
                    firstName,
                    lastName: lastName || null,
                    nusnetId: nusnet || null,
                    telegramHandle: normalizedHandle,
                    role: role || undefined,
                },
            });

            // Update group memberships if groupIds provided
            if (groupIds !== undefined) {
                // Get current memberships
                const currentMemberships = await tx.iHMember.findMany({
                    where: { userId },
                    select: { ihId: true, isPrimary: true },
                });

                const currentGroupIds = currentMemberships.map((m) => m.ihId);
                const newGroupIds = groupIds;

                // Groups to remove
                const toRemove = currentGroupIds.filter((id) => !newGroupIds.includes(id));
                // Groups to add
                const toAdd = newGroupIds.filter((id) => !currentGroupIds.includes(id));

                // Remove memberships
                if (toRemove.length > 0) {
                    await tx.iHMember.deleteMany({
                        where: {
                            userId,
                            ihId: { in: toRemove },
                        },
                    });
                }

                // Add new memberships
                if (toAdd.length > 0) {
                    await tx.iHMember.createMany({
                        data: toAdd.map((ihId) => ({
                            userId,
                            ihId,
                            isPrimary: false,
                        })),
                    });
                }
            }
        });

        revalidatePath("/users");
        return { success: true };
    } catch (e) {
        console.error("Failed to update user:", e);
        const message = e instanceof Error ? e.message : "Failed to update user";
        return { success: false, error: message };
    }
}

/**
 * Delete a user (fails if they have loans)
 * Also cleans up any INDIVIDUAL IHs that were created for this user (if no items reference them)
 * Requires ADMIN role
 */
export async function deleteUser(userId: number): Promise<ActionResult> {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return { success: false, error: auth.error };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { userId },
            include: {
                _count: {
                    select: {
                        loanRequests: true,
                        handledLoans: true,
                    },
                },
                ihMemberships: {
                    include: {
                        ih: {
                            include: {
                                _count: {
                                    select: { items: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return { success: false, error: "User not found" };
        }

        if (user._count.loanRequests > 0 || user._count.handledLoans > 0) {
            return { success: false, error: "Cannot delete user with loan history" };
        }

        // Check if user is sole member of any INDIVIDUAL IH that has items
        for (const membership of user.ihMemberships) {
            if (membership.ih.ihType === IHType.INDIVIDUAL && membership.ih._count.items > 0) {
                return { 
                    success: false, 
                    error: `Cannot delete user: they are the IH for ${membership.ih._count.items} item(s). Reassign items first.` 
                };
            }
        }

        await prisma.$transaction(async (tx) => {
            // Find INDIVIDUAL IHs that should be deleted (no items)
            const individualIHsToDelete = user.ihMemberships
                .filter(m => m.ih.ihType === IHType.INDIVIDUAL && m.ih._count.items === 0)
                .map(m => m.ihId);

            // Delete the user (this cascades to IHMember)
            await tx.user.delete({
                where: { userId },
            });

            // Delete orphaned INDIVIDUAL IHs
            if (individualIHsToDelete.length > 0) {
                await tx.iH.deleteMany({
                    where: { ihId: { in: individualIHsToDelete } },
                });
            }
        });

        revalidatePath("/users");
        revalidatePath("/catalogue");
        return { success: true };
    } catch (e) {
        console.error("Failed to delete user:", e);
        const message = e instanceof Error ? e.message : "Failed to delete user";
        return { success: false, error: message };
    }
}
/**
 * Add a user to a group
 * Requires ADMIN role
 */
export async function addUserToGroup(userId: number, ihId: string, isPrimary: boolean = false): Promise<ActionResult> {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return { success: false, error: auth.error };
    }

    try {
        // Check if membership already exists
        const existing = await prisma.iHMember.findUnique({
            where: { userId_ihId: { userId, ihId } },
        });

        if (existing) {
            return { success: false, error: "User is already a member of this group" };
        }

        // If setting as primary, unset other primaries first
        if (isPrimary) {
            await prisma.iHMember.updateMany({
                where: { ihId, isPrimary: true },
                data: { isPrimary: false },
            });
        }

        await prisma.iHMember.create({
            data: { userId, ihId, isPrimary },
        });

        revalidatePath("/users");
        return { success: true };
    } catch (e) {
        console.error("Failed to add user to group:", e);
        const message = e instanceof Error ? e.message : "Failed to add user to group";
        return { success: false, error: message };
    }
}

/**
 * Remove a user from a group
 * Requires ADMIN role
 */
export async function removeUserFromGroup(userId: number, ihId: string): Promise<ActionResult> {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return { success: false, error: auth.error };
    }

    try {
        await prisma.iHMember.delete({
            where: { userId_ihId: { userId, ihId } },
        });

        revalidatePath("/users");
        return { success: true };
    } catch (e) {
        console.error("Failed to remove user from group:", e);
        const message = e instanceof Error ? e.message : "Failed to remove user from group";
        return { success: false, error: message };
    }
}

/**
 * Set a user as primary POC for a group (unsets previous primary)
 * Requires ADMIN role
 */
export async function setPrimaryPOC(ihId: string, userId: number): Promise<ActionResult> {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return { success: false, error: auth.error };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Verify membership exists first
            const membership = await tx.iHMember.findUnique({
                where: { userId_ihId: { userId, ihId } }
            });
            
            if (!membership) {
                throw new Error("User is not a member of this group");
            }

            // Unset current primary
            await tx.iHMember.updateMany({
                where: { ihId, isPrimary: true },
                data: { isPrimary: false },
            });

            // Set new primary
            await tx.iHMember.update({
                where: { userId_ihId: { userId, ihId } },
                data: { isPrimary: true },
            });
        });

        revalidatePath("/users");
        return { success: true };
    } catch (e) {
        console.error("Failed to set primary POC:", e);
        const message = e instanceof Error ? e.message : "Failed to set primary POC";
        return { success: false, error: message };
    }
}

/**
 * Create a new GROUP IH inline
 * Requires ADMIN role
 */
export async function createGroupIH(data: z.infer<typeof CreateGroupIHSchema>): Promise<ActionResult<IH>> {
    const auth = await requireAdminAuth();
    if (!auth.authorized) {
        return { success: false, error: auth.error };
    }

    const parseResult = CreateGroupIHSchema.safeParse(data);
    if (!parseResult.success) {
        return { success: false, error: "Validation failed" };
    }

    const { ihName } = parseResult.data;

    try {
        // Generate ihId from name (lowercase, replace spaces with hyphens)
        const ihId = ihName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

        // Check if IH with this ID already exists
        const existing = await prisma.iH.findUnique({
            where: { ihId },
        });

        if (existing) {
            return { success: false, error: `A group with ID "${ihId}" already exists` };
        }

        const newIH = await prisma.iH.create({
            data: {
                ihId,
                ihName,
                ihType: IHType.GROUP,
            },
        });

        revalidatePath("/users");
        return { success: true, data: newIH };
    } catch (e) {
        console.error("Failed to create group:", e);
        const message = e instanceof Error ? e.message : "Failed to create group";
        return { success: false, error: message };
    }
}

