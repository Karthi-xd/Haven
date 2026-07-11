import { supabase } from "../lib/supabaseClient";
import type { ReactableKind, Chime } from "../types";

/** Fetch every Chime (comment) growing off a Blurt, oldest first. */
export async function fetchChimes(targetKind: ReactableKind, targetId: string) {
  const { data, error } = await supabase
    .from("sprouts")
    .select("*, author:profiles(*)")
    .eq("target_kind", targetKind)
    .eq("target_id", targetId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as unknown as Chime[];
}

export async function createChime(
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
  return data as unknown as Chime;
}

export async function deleteChime(id: string) {
  const { error } = await supabase.from("sprouts").delete().eq("id", id);
  if (error) throw error;
}
