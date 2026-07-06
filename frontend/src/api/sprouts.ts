import { supabase } from "../lib/supabaseClient";
import type { ReactableKind, Sprout } from "../types";

/** Fetch every Sprout (comment) growing off a Petal or Whisper, oldest first. */
export async function fetchSprouts(targetKind: ReactableKind, targetId: string) {
  const { data, error } = await supabase
    .from("sprouts")
    .select("*, author:profiles(*)")
    .eq("target_kind", targetKind)
    .eq("target_id", targetId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as Sprout[];
}

export async function createSprout(
  targetKind: ReactableKind,
  targetId: string,
  body: string,
  parentId: string | null = null
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("sprouts")
    .insert({
      target_kind: targetKind,
      target_id: targetId,
      author_id: user.id,
      parent_id: parentId,
      body,
    })
    .select("*, author:profiles(*)")
    .single();
  if (error) throw error;
  return data as unknown as Sprout;
}

export async function deleteSprout(id: string) {
  const { error } = await supabase.from("sprouts").delete().eq("id", id);
  if (error) throw error;
}
