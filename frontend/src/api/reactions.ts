import { supabase } from "../lib/supabaseClient";
import type { ReactableKind } from "../types";

async function currentUserId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return user.id;
}

/** Toggle a lightweight positive Buzz on a Flash or Blurt. */
export async function toggleBuzz(targetKind: ReactableKind, targetId: string) {
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

/** Toggle a Strike (the negative reaction) on a Flash or Blurt. */
export async function toggleStrike(targetKind: ReactableKind, targetId: string) {
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

/** Toggle a Spark — the rare "this changed how I see things" reaction. */
export async function toggleSpark(targetKind: ReactableKind, targetId: string) {
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
