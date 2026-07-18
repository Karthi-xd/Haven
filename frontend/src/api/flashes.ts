import { supabase } from "../lib/supabaseClient";
import type { Flash, MediaKind } from "../types";

const VIEW = "flashes_with_author";
const TABLE = "flashes";

export async function fetchSpaceFlashes(authorId: string) {
  const { data, error } = await supabase
    .from(VIEW)
    .select("*")
    .eq("author_id", authorId)
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return data as Flash[];
}

export async function createFlash(
  mediaUrl: string,
  mediaKind: MediaKind,
  caption: string,
  keepForever: boolean
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const expires_at = keepForever ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      author_id: user.id,
      media_url: mediaUrl,
      media_kind: mediaKind,
      caption,
      lingering: keepForever,
      expires_at,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Let it linger: stops the 24h countdown and makes the Flash permanent. */
export async function letFlashLinger(id: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ lingering: true, expires_at: null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFlash(id: string) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}