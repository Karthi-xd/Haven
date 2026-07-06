import { supabase } from "../lib/supabaseClient";
import type { PetalPathNode } from "../types";

/** The branching map of where a Garden's Petals traveled and settled. */
export async function fetchPetalPath(authorId: string): Promise<PetalPathNode[]> {
  const { data, error } = await supabase
    .from("petals_with_counts")
    .select("id, media_url, posted_at, fallen, touch_count, rootbloom_count")
    .eq("author_id", authorId)
    .order("posted_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    petal_id: p.id,
    media_url: p.media_url,
    posted_at: p.posted_at,
    alive: !p.fallen, // alive Petals pulse gently, fallen ones freeze in place
    touch_count: p.touch_count,
    rootbloom_count: p.rootbloom_count,
  }));
}
