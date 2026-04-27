import crypto from "crypto";
import { getSupabaseAdmin } from "./supabase";

const AVATAR_BUCKET = "avatars";

export async function saveAvatar(userId: string, buffer: Buffer, ext: string): Promise<string> {
  const supabaseAdmin = getSupabaseAdmin();
  const filename = `${userId}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const objectPath = `${userId}/${filename}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(AVATAR_BUCKET)
    .upload(objectPath, buffer, {
      contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabaseAdmin.storage.from(AVATAR_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export function getAllowedImageExt(mimeType: string): string | null {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[mimeType] ?? null;
}
