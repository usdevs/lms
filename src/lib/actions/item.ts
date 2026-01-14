"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import fs from "fs";
import path from "path";

import prisma from "@/lib/prisma";
import { formDataToObject } from "@/lib/utils";
import {
  DeleteItemSchema,
  EditItemServerSchema,
  NewItemServerSchema,
} from "@/lib/schema/item";
import { Prisma } from "@prisma/client";
import { ItemPaginationParams, PaginatedItemsResponse } from "../types/items";

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

  try {
    await prisma.item.create({
      data: {
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

export async function updateItem(itemId: number, formData: FormData) {
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
  
  const deleteImage = formData.get("deleteImage") === "true"; // Checks whether to delete   

  try {
    // Delete image 
    const fs = require("fs");
    const path = require("path");

    if (deleteImage && data.itemImage) {
      try {
        const filePath = path.join(
          process.cwd(),
          "public",
          data.itemImage.replace(/^\/+/, "")
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log("Deleted old image:", filePath);
        }
        data.itemImage = null; // Clear from database
      } catch (err) {
        console.error("Failed to delete old image:", err);
      }
    }

    await prisma.item.update({
      where: { itemId: itemId as any },
      data: {
        itemId: itemId,
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

export async function deleteItem(itemId: number) {
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
      where: { itemId: data.itemId as any },
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

export async function getItemsPaginated(params: ItemPaginationParams): Promise<PaginatedItemsResponse> {
  try {
    const skip = (params.page - 1) * params.limit;

    // Build where clause for filters with proper typing
    const conditions: Prisma.ItemWhereInput[] = [];

    if (params.search) {
      const searchConditions: Prisma.ItemWhereInput[] = [
        { itemDesc: { contains: params.search, mode: "insensitive" } },
        { itemRemarks: { contains: params.search, mode: "insensitive" } },
        { sloc: { slocName: { contains: params.search, mode: "insensitive" } } },
        { ih: { ihName: { contains: params.search, mode: "insensitive" } } },
      ];

      // Only search by itemId if the search string is a valid number
      const itemIdNumber = parseInt(params.search, 10);
      if (!isNaN(itemIdNumber) && itemIdNumber.toString() === params.search.trim()) {
        searchConditions.push({ itemId: { equals: itemIdNumber } });
      }

      conditions.push({
        OR: searchConditions,
      });
    }

    if (params.slocId) {
      conditions.push({ itemSloc: params.slocId });
    }

    if (params.ihId) {
      conditions.push({ itemIh: params.ihId });
    }

    // Build where clause
    const where: Prisma.ItemWhereInput =
      conditions.length > 0 ? { AND: conditions } : {};

    // Build orderBy clause with proper typing
    const orderBy: Prisma.ItemOrderByWithRelationInput =
      params.sort === "name"
        ? { itemDesc: params.asc ? "asc" : "desc" }
        : params.sort === "quantity"
          ? { itemQty: params.asc ? "asc" : "desc" }
          : params.sort === "id"
            ? { itemId: params.asc ? "asc" : "desc" }
            : { itemId: "desc" };

    // Get filtered items with pagination
    const items = await prisma.item.findMany({
      where,
      skip,
      take: params.limit,
      orderBy,
      select: {
        itemId: true,
        itemDesc: true,
        itemQty: true,
        itemUom: true,
        itemRemarks: true,
        itemPurchaseDate: true,
        itemRfpNumber: true,
        itemImage: true,
        itemSloc: true,
        itemIh: true,
        sloc: {
          select: {
            slocId: true,
            slocName: true,
          },
        },
        ih: {
          select: {
            ihId: true,
            ihName: true,
          },
        },
      },
    });

    // Count total items matching filters
    const totalItems = await prisma.item.count({ where });
    const totalPages = Math.ceil(totalItems / params.limit);

    return {
      data: items,
      meta: {
        page: params.page,
        pageSize: params.limit,
        totalItems,
        totalPages,
      },
    };

  } catch (error) {
    console.error("Failed to fetch paginated items:", error);
    throw new Error("Failed to fetch items");
  }
}

export async function uploadItemImage(formData: FormData): Promise<{ url: string } | { error: string }> {
  try {
    const file = formData.get("photo") as File;

    if (!file) {
      return { error: "No file uploaded" };
    }

    const uploadsDir = path.join(process.cwd(), "public/uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadsDir, uniqueName);
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

    const url = `/uploads/${uniqueName}`;
    return { url };
  } catch (error) {
    console.error("Failed to upload file:", error);
    return { error: "Failed to upload file" };
  }
}
