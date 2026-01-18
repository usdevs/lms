import { z } from "zod/v4";
import { CreateUserSchema } from "./user";

// --- Sub-schemas ---

// For selecting an item and quantity
export const LoanItemSchema = z.object({
    itemId: z.number(),
    loanQty: z.number().min(1, "Quantity must be at least 1"),
});

// --- Main Server Action Schemas --

export const CreateLoanSchema = z.object({
    loanDateStart: z.coerce.date(),
    loanDateEnd: z.coerce.date(),

    // Requester details
    requesterId: z.number().optional(), // Existing User ID
    newRequester: CreateUserSchema.optional(),

    // Optional string fields
    organisation: z.string().optional(),
    eventDetails: z.string().optional(),
    eventLocation: z.string().optional(),

    // Items
    items: z.array(LoanItemSchema).min(1, "At least one item must be added"),
}).refine((data) => !!data.requesterId || !!data.newRequester, {
    message: "You must select or create a requester",
    path: ["requesterId"],
});
