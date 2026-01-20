"use server";

import path from "path";
import fs from "fs/promises";

// Check if running on Vercel (production) or locally
const isVercel = process.env.VERCEL === "1";

// Lazy load supabase client only when needed (on Vercel)
async function getSupabaseClient() {
  const { supabase } = await import("./supabase");
  return supabase;
}

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/**
 * Ensures the uploads directory exists (local only)
 */
async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Upload an image file to storage
 * - Local: saves to /public/uploads
 * - Vercel: uploads to Supabase Storage
 */
export async function uploadImage(
  file: File,
  bucket: string = "item-images"
): Promise<{ url: string } | { error: string }> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}-${sanitizedName}`;

  if (isVercel) {
    // Upload to Supabase Storage
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(uniqueName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase storage error:", error);
      return { error: "Failed to upload file" };
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return { url: publicUrl };
  } else {
    // Save locally to /public/uploads
    try {
      await ensureUploadsDir();

      const filePath = path.join(UPLOADS_DIR, uniqueName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);

      // Return URL path that Next.js can serve from /public
      return { url: `/uploads/${uniqueName}` };
    } catch (err) {
      console.error("Local storage error:", err);
      return { error: "Failed to save file locally" };
    }
  }
}

/**
 * Delete an image from storage
 * - Local: deletes from /public/uploads
 * - Vercel: deletes from Supabase Storage
 */
export async function deleteImage(
  imageUrl: string,
  bucket: string = "item-images"
): Promise<{ success: boolean; error?: string }> {
  if (!imageUrl) {
    return { success: true };
  }

  try {
    if (isVercel || imageUrl.includes("supabase.co")) {
      // Delete from Supabase Storage
      // URL format: https://[project].supabase.co/storage/v1/object/public/item-images/[filename]
      const supabase = await getSupabaseClient();
      const urlParts = imageUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];

      if (fileName) {
        const { error } = await supabase.storage.from(bucket).remove([fileName]);

        if (error) {
          console.error("Failed to delete image from Supabase:", error);
          return { success: false, error: error.message };
        }
      }
    } else if (imageUrl.startsWith("/uploads/")) {
      // Delete from local storage
      const fileName = imageUrl.replace("/uploads/", "");
      const filePath = path.join(UPLOADS_DIR, fileName);

      try {
        await fs.unlink(filePath);
      } catch (err) {
        // File might not exist, which is fine
        console.warn("Could not delete local file:", err);
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Failed to delete image:", err);
    return { success: false, error: "Failed to delete image" };
  }
}
