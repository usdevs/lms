"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { CreateSlocSchema } from "@/lib/schema/sloc";
import { ActionResult } from "../types/actionResult";
import { getSession } from "@/lib/auth/session";
import { canManageSlocs } from "@/lib/auth/rbac";

/**
 * Create a new Storage Location (SLOC)
 * Requires LOGS or ADMIN role
 */
export async function createSloc(data: z.infer<typeof CreateSlocSchema>): Promise<ActionResult<{ slocId: string; slocName: string }>> {
  // Check authorization
  const session = await getSession();
  if (!session) {
    return { success: false, error: "Authentication required" };
  }
  if (!canManageSlocs(session.user.role)) {
    return { success: false, error: "LOGS or ADMIN access required to create locations" };
  }

  const parseResult = CreateSlocSchema.safeParse(data);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.issues[0].message };
  }

  const { slocName } = parseResult.data;

  try {
    // Generate a slug-like ID from the name
    const slocId = slocName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    // Check if ID already exists
    const existing = await prisma.sloc.findUnique({ where: { slocId } });
    if (existing) {
      return { success: false, error: "A location with a similar name already exists" };
    }

    const sloc = await prisma.sloc.create({
      data: {
        slocId,
        slocName,
      },
    });

    revalidatePath("/catalogue");
    return { success: true, data: { slocId: sloc.slocId, slocName: sloc.slocName } };
  } catch (error) {
    console.error("Failed to create location:", error);
    return { success: false, error: "Failed to create location" };
  }
}
