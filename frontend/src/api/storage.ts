import { supabase } from "../lib/supabaseClient";
import type { MediaKind } from "../types";

const BUCKET = "haven-media";

export async function uploadAvatarImage(file: File) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const ext = file.name.split(".").pop() || "bin";
  const path = `${user.id}/avatar-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Uploads a Flash or Vault attachment and reports back its public URL + kind. */
export async function uploadMoment(file: File, folder: "flash" | "vault") {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const ext = file.name.split(".").pop() || "bin";
  const path = `${user.id}/${folder}-${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const media_kind: MediaKind = file.type.startsWith("video") ? "video" : "image";
  return { url: data.publicUrl, media_kind };
}