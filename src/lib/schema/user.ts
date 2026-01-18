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

