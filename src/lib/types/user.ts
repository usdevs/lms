import { UserRole } from "@prisma/client";

/**
 * Type for creating a new user
 * Used in forms and can be used for future createUser function
 */
export type NewUserDetails = {
    firstName: string;
    lastName?: string;
    nusnet?: string;
    telegramHandle: string;
    role?: UserRole; // Defaults to REQUESTER if not provided
};
