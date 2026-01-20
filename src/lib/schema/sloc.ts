import { z } from "zod";

/**
 * Schema for creating a new Storage Location (SLOC)
 */
export const CreateSlocSchema = z.object({
  slocName: z.string().min(1, "Location name is required"),
});
