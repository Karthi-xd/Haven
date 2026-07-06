import { supabase } from "../lib/supabaseClient";
import type { ReactableKind } from "../types";

async function currentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return user.id;
}

/** Toggle a lightweight positive Touch on a Petal or Whisper. */
export async function toggleTouch(targetKind: ReactableKind, targetId: string) {
  const userId = await currentUserId();
  const { data: existing } = await supabase
    .from("touches")
    .select("id")
    .eq("user_id", userId)
    .eq("target_kind", targetKind)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("touches").delete().eq("id", existing.id);
    if (error) throw error;
    return { active: false };
  }
  const { error } = await supabase
    .from("touches")
    .insert({ user_id: userId, target_kind: targetKind, target_id: targetId });
  if (error) throw error;
  return { active: true };
}

/** Toggle a Wilt (the negative reaction) on a Petal or Whisper. */
export async function toggleWilt(targetKind: ReactableKind, targetId: string) {
  const userId = await currentUserId();
  const { data: existing } = await supabase
    .from("wilts")
    .select("id")
    .eq("user_id", userId)
    .eq("target_kind", targetKind)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("wilts").delete().eq("id", existing.id);
    if (error) throw error;
    return { active: false };
  }
  const { error } = await supabase
    .from("wilts")
    .insert({ user_id: userId, target_kind: targetKind, target_id: targetId });
  if (error) throw error;
  return { active: true };
}

/** Toggle a Rootbloom — the rare "this changed how I see things" reaction. */
export async function toggleRootbloom(targetKind: ReactableKind, targetId: string) {
  const userId = await currentUserId();
  const { data: existing } = await supabase
    .from("rootblooms")
    .select("id")
    .eq("user_id", userId)
    .eq("target_kind", targetKind)
    .eq("target_id", targetId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("rootblooms").delete().eq("id", existing.id);
    if (error) throw error;
    return { active: false };
  }
  const { error } = await supabase
    .from("rootblooms")
    .insert({ user_id: userId, target_kind: targetKind, target_id: targetId });
  if (error) throw error;
  return { active: true };
}
