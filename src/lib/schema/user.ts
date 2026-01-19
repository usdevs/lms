import { z } from "zod/v4";
import { UserRole } from "@prisma/client";

/**
 * Schema for creating a new user
 * Can be used across different components that need to create users
 */
export const CreateUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    nusnet: z.string().optional(), // Optional NUSNET ID
    telegramHandle: z.string().min(1, "Telegram handle is required").refine((val) => {
        // Remove @ if present and validate format
        const handle = val.startsWith("@") ? val.slice(1) : val;
        // Telegram handles are 5-32 characters, alphanumeric and underscores
        return /^[a-zA-Z0-9_]{5,32}$/.test(handle);
    }, {
        message: "Telegram handle must be 5-32 characters (letters, numbers, underscores). Include @ prefix if desired.",
    }),
    role: z.enum(UserRole).optional(), // Optional role, defaults to REQUESTER
});

/**
 * Schema for creating a user with group memberships (for Manage Users page)
 */
export const CreateUserWithGroupsSchema = CreateUserSchema.extend({
    groupIds: z.array(z.string()).optional(), // IH IDs for group memberships
});

/**
 * Schema for updating a user
 */
export const UpdateUserSchema = z.object({
    userId: z.number(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    nusnet: z.string().optional(),
    telegramHandle: z.string().min(1, "Telegram handle is required").refine((val) => {
        const handle = val.startsWith("@") ? val.slice(1) : val;
        return /^[a-zA-Z0-9_]{5,32}$/.test(handle);
    }, {
        message: "Telegram handle must be 5-32 characters (letters, numbers, underscores).",
    }),
    role: z.enum(UserRole).optional(),
    groupIds: z.array(z.string()).optional(),
});

/**
 * Schema for creating a new IH group inline
 */
export const CreateGroupIHSchema = z.object({
    ihName: z.string().min(1, "Group name is required"),
});
