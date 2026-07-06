import { supabase } from "../lib/supabaseClient";
import type { Petal } from "../types";

/** Public feed: everyone's non-followers-only Petals that haven't fallen yet. */
export async function fetchPetalFeed(limit = 30) {
  const { data, error } = await supabase
    .from("petals_with_counts")
    .select("*")
    .eq("fallen", false)
    .order("posted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Petal[];
}

/** All Petals (alive + fallen) belonging to one Garden, newest first — used by the Garden grid. */
export async function fetchGardenPetals(authorId: string) {
  const { data, error } = await supabase
    .from("petals_with_counts")
    .select("*")
    .eq("author_id", authorId)
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return data as Petal[];
}

export async function fetchPetal(id: string) {
  const { data, error } = await supabase.from("petals_with_counts").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Petal;
}

export async function createPetal(input: {
  media_url: string;
  media_kind: "image" | "video";
  caption?: string;
  followers_only?: boolean;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("petals")
    .insert({
      author_id: user.id,
      media_url: input.media_url,
      media_kind: input.media_kind,
      caption: input.caption ?? "",
      followers_only: input.followers_only ?? false, // deliberately buried, defaults to public
    })
    .select()
    .single();
  if (error) throw error;
  return data as Petal;
}

export async function deletePetal(id: string) {
  const { error } = await supabase.from("petals").delete().eq("id", id);
  if (error) throw error;
}
