import { supabase } from "../lib/supabaseClient";
import type { Bloom } from "../types";

/** A user's own sealed Blooms — never shown to anyone else while sealed. */
export async function fetchMyBlooms() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("blooms")
    .select("*")
    .eq("author_id", user.id)
    .order("unlocks_at", { ascending: true });
  if (error) throw error;
  return data as Bloom[];
}

export async function createBloom(input: {
  media_url: string;
  media_kind: "image" | "video";
  caption?: string;
  followers_only?: boolean;
  unlocks_at: string; // ISO timestamp in the future
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("blooms")
    .insert({
      author_id: user.id,
      media_url: input.media_url,
      media_kind: input.media_kind,
      caption: input.caption ?? "",
      followers_only: input.followers_only ?? false,
      unlocks_at: input.unlocks_at,
      sealed: true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Bloom;
}

export async function deleteBloom(id: string) {
  const { error } = await supabase.from("blooms").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Unlocking (sealed -> live Petal) happens server-side on a schedule
 * (see supabase/functions/expire-content). This is exposed for a manual
 * "unlock now" debug action if you want one in the UI.
 */
export async function unlockBloomNow(id: string) {
  const { data, error } = await supabase.rpc("unlock_bloom", { bloom_id: id });
  if (error) throw error;
  return data;
}
