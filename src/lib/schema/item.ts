import { z } from "zod/v4";

// Treat empty/undefined/null as undefined, otherwise coerce to Date
const optionalDate = z.preprocess(
  (v) => (v === undefined || v === null || v === "" ? undefined : v),
  z.coerce.date()
);

export const NewItemClientSchema = z.object({
  nuscSn: z.string().min(1, "NUSC SN is required"),
  itemDesc: z.string().min(1, "Description is required"),
  itemSloc: z.string().min(1, "Storage Location is required"),
  itemIh: z.string().min(1, "Inventory Holder is required"),
  itemQty: z.coerce.number().int().positive("Quantity must be a positive number"),
  itemUom: z.string().min(1, "Unit of Measure is required"),
  itemRemarks: z.string().optional().nullable(),
  itemPurchaseDate: optionalDate.optional(),
  itemRfpNumber: z.string().optional().nullable(),
  itemImage: z
    .union([
      z.url("Must be a valid URL"),
      z.literal(""),
      z.undefined(),
      z.null(),
    ])
    .optional()
    .nullable(),
});

export const NewItemServerSchema = NewItemClientSchema;

export const DeleteItemSchema = z.object({
  itemId: z.coerce.number().int().positive(),
});

export const EditItemClientSchema = z.object({
  itemId: z.coerce.number().int().positive(),
  nuscSn: z.string().min(1, "NUSC SN is required"),
  itemDesc: z.string().min(1, "Description is required"),
  itemSloc: z.string().min(1, "Storage Location is required"),
  itemIh: z.string().min(1, "Inventory Holder is required"),
  itemQty: z.coerce.number().int().positive("Quantity must be a positive number"),
  itemUom: z.string().min(1, "Unit of Measure is required"),
  itemRemarks: z.string().optional().nullable(),
  itemPurchaseDate: optionalDate.optional(),
  itemRfpNumber: z.string().optional().nullable(),
  itemImage: z
    .union([
      z.string().url("Must be a valid URL"),
      z.literal(""),
      z.undefined(),
      z.null(),
    ])
    .optional()
    .nullable(),
});

export const EditItemServerSchema = EditItemClientSchema;

