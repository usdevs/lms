

import { z } from "zod/v4";

// --- Sub-schemas ---

// For selecting an item and quantity
export const LoanItemSchema = z.object({
    itemId: z.number(),
    loanQty: z.number().min(1, "Quantity must be at least 1"),
});

// For defining the requester (either creating new or selecting existing)
export const RequesterSchema = z.object({
    // If reqId is present, we are selecting an existing one.
    reqId: z.number().optional(),

    // If creating new, these are required
    reqName: z.string().min(1, "Name is required").optional(),
    reqNusnet: z.string().optional(), // Made optional to allow just searching by name initially or purely manual entry? 
    // Actually, let's enforce NUSNET or some ID if we are creating new, but the UI might be flexible.
    // For now, let's match the DB schema constraints: reqName is required, reqNusnet is unique map.

    reqTelehandle: z.string().optional(),
}).refine(data => {
    // Logic: If reqId is missing, reqName and reqNusnet are required to create a new one?
    // Or maybe we treat "create new" as a separate strict schema.
    // Let's keep it simple: The form will likely pass either an ID OR the new details.
    if (!data.reqId) {
        return !!data.reqName && !!data.reqNusnet;
    }
    return true;
}, {
    message: "Name and NUSNET ID are required for new requesters",
    path: ["reqName"],
});


// --- Main Server Action Schemas --

export const CreateLoanSchema = z.object({
    loanDateStart: z.coerce.date(),
    loanDateEnd: z.coerce.date(),

    // Requester details
    requesterId: z.number().optional(), // Existing ID
    newRequester: z.object({
        name: z.string().min(1),
        nusnet: z.string().min(1),
        telehandle: z.string().optional(),
    }).optional(),

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

export const ReturnItemSchema = z.object({
    loanDetailId: z.number(),
});
