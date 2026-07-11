"use client";

import { createClient } from "@/lib/supabase/client";

export interface UploadResult {
  ok: boolean;
  url?: string;
  error?: string;
}

/** Uploads an identification photo to the public `client-photos` bucket and returns its public URL. */
export async function uploadClientPhoto(file: File): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Please choose an image file." };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Image must be smaller than 5MB." };
  }

  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("client-photos").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data } = supabase.storage.from("client-photos").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
