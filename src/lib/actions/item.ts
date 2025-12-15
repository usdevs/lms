"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

import prisma from "@/lib/prisma";
import { formDataToObject } from "@/lib/utils";
import {
  DeleteItemSchema,
  EditItemServerSchema,
  NewItemServerSchema,
} from "@/lib/schema/item";

export async function createItem(formData: FormData) {
  let data;
  try {
    data = NewItemServerSchema.parse(formDataToObject(formData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: z.prettifyError(error),
      };
    }
    return {
      success: false,
      error: "Unknown error occurred. Please contact admin.",
    };
  }

  // Check if item ID already exists
  const existingItem = await prisma.item.findUnique({
    where: { itemId: data.itemId.trim() },
  });
  if (existingItem) {
    return {
      success: false,
      error: `Item ID "${data.itemId.trim()}" already exists. Please use a different ID.`,
    };
  }

  try {
    await prisma.item.create({
      data: {
        itemId: data.itemId.trim(),
        itemDesc: data.itemDesc.trim(),
        itemSloc: data.itemSloc.trim(),
        itemIh: data.itemIh.trim(),
        itemQty: data.itemQty,
        itemUom: data.itemUom.trim(),
        itemRemarks: data.itemRemarks?.trim() || null,
        itemPurchaseDate: data.itemPurchaseDate || null,
        itemRfpNumber: data.itemRfpNumber?.trim() || null,
        itemImage: data.itemImage?.trim() || null,
      },
    });
  } catch (error: any) {
    console.error("Error creating item:", error);

    // Handle Prisma-specific errors
    if (error.code === "P2002") {
      return {
        success: false,
        error: "An item with this ID already exists. Please use a different ID.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to create item. Please try again.",
    };
  }

  revalidatePath("/catalogue");
  return { success: true };
}

export async function updateItem(itemId: string, formData: FormData) {
  let data;
  try {
    data = EditItemServerSchema.parse(formDataToObject(formData));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: z.prettifyError(error),
      };
    }
    return {
      success: false,
      error: "Unknown error occurred. Please contact admin.",
    };
  }

  const newItemId = data.itemId.trim();
  const originalItemId = itemId.trim();

  // If the ID is being changed, ensure the new ID is unique
  if (newItemId !== originalItemId) {
    const existingItem = await prisma.item.findUnique({
      where: { itemId: newItemId },
    });
    if (existingItem) {
      return {
        success: false,
        error: `Item ID "${newItemId}" already exists. Please use a different ID.`,
      };
    }
  }

  try {
    await prisma.item.update({
      where: { itemId: originalItemId },
      data: {
        itemId: newItemId,
        itemDesc: data.itemDesc.trim(),
        itemSloc: data.itemSloc.trim(),
        itemIh: data.itemIh.trim(),
        itemQty: data.itemQty,
        itemUom: data.itemUom.trim(),
        itemRemarks: data.itemRemarks?.trim() || null,
        itemPurchaseDate: data.itemPurchaseDate || null,
        itemRfpNumber: data.itemRfpNumber?.trim() || null,
        itemImage: data.itemImage?.trim() || null,
      },
    });
  } catch (error: any) {
    console.error("Error updating item:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        error: "Item not found. It may have been deleted.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to update item. Please try again.",
    };
  }

  revalidatePath("/catalogue");
  return { success: true };
}

export async function deleteItem(itemId: string) {
  let data;
  try {
    data = DeleteItemSchema.parse({ itemId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: z.prettifyError(error),
      };
    }
    return {
      success: false,
      error: "Unknown error occurred. Please contact admin.",
    };
  }

  try {
    await prisma.item.delete({
      where: { itemId: data.itemId },
    });
  } catch (error: any) {
    console.error("Error deleting item:", error);

    if (error.code === "P2025") {
      return {
        success: false,
        error: "Item not found. It may have already been deleted.",
      };
    }

    return {
      success: false,
      error: error.message || "Failed to delete item. Please try again.",
    };
  }

  revalidatePath("/catalogue");
  return { success: true };
}

