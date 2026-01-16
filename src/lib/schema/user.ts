import { z } from "zod/v4";

/**
 * Schema for creating a new user
 * Can be used across different components that need to create users
 */
export const CreateUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().optional(),
    nusnet: z.string().min(1, "NUSNET ID is required"),
    username: z.string().optional(), // Optional username/telehandle
    telegramId: z.coerce.bigint().optional(), // Optional, will generate placeholder if not provided
});

