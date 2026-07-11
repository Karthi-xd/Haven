import { supabase } from "../lib/supabaseClient";
import type { Flash } from "../types";

/**
 * Flash is a planned feature (the renamed "Petal") — a media-first, short-lived
 * post. The `flashes` table doesn't exist in Supabase yet, so these calls fail
 * soft and return an empty list instead of throwing, which lets the Home tab
 * render its premium empty state instead of crashing. Once the `flashes`
 * table + storage bucket are created, this will start returning real rows
 * with no changes needed on the UI side.
 */
export async function fetchFlashes(limit = 20): Promise<Flash[]> {
  try {
    const { data, error } = await supabase
      .from("flashes")
      .select("*")
      .order("posted_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Flash[];
  } catch {
    return [];
  }
}

export async function createFlash(mediaUrl: string, caption: string): Promise<Flash> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("flashes")
    .insert({ author_id: user.id, media_url: mediaUrl, caption })
    .select()
    .single();
  if (error) throw error;
  return data as Flash;
}