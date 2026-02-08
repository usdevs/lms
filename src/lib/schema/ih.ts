import z from "zod";

/**
 * Schema for creating a new IH group inline
 */
export const CreateGroupIHSchema = z.object({
    ihName: z.string().min(1, "Group name is required"),
});

/**
 * Schema for renaming a group (ihId fixed, ihName updated)
 */
export const UpdateGroupIHSchema = z.object({
    ihId: z.string().min(1, "Group ID is required"),
    ihName: z.string().min(1, "Group name is required"),
});
