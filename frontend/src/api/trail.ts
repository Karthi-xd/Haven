import { supabase } from "../lib/supabaseClient";
import type { TrailNode } from "../types";

/** The branching map of where a Space's Flashes traveled and settled. */
export async function fetchTrail(authorId: string): Promise<TrailNode[]> {
  const { data, error } = await supabase
    .from("flashes_with_counts")
    .select("id, media_url, posted_at, fallen, touch_count, rootbloom_count")
    .eq("author_id", authorId)
    .order("posted_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((p: any) => ({
    flash_id: p.id,
    media_url: p.media_url,
    posted_at: p.posted_at,
    alive: !p.fallen,
    buzz_count: p.touch_count,
    spark_count: p.rootbloom_count,
  }));
}
