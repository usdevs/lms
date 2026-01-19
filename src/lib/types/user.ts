import { UserRole } from "@prisma/client";
import { getUsersWithDetails } from "../utils/server/users";
import { getGroupIHs } from "../utils/server/ih";

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

/**
 * User with full details for management views
 */
export type UserWithDetails = Awaited<ReturnType<typeof getUsersWithDetails>>[number];

/**
 * Group/Department IH with all members
 */
export type GroupIHWithMembers = Awaited<ReturnType<typeof getGroupIHs>>[number];
