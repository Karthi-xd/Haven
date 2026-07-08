import { supabase } from "../lib/supabaseClient";

/** Start Tending someone's Space (follow). */
export async function tendSpace(tendedId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { error } = await supabase.from("tending").insert({ tender_id: user.id, tended_id: tendedId });
  if (error) throw error;
}

/** Stop Tending someone's Space (unfollow). */
export async function untendSpace(tendedId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { error } = await supabase
    .from("tending")
    .delete()
    .eq("tender_id", user.id)
    .eq("tended_id", tendedId);
  if (error) throw error;
}

export async function isTending(tendedId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("tending")
    .select("id")
    .eq("tender_id", user.id)
    .eq("tended_id", tendedId)
    .maybeSingle();
  return !!data;
}

/** People tending this Space (followers). */
export async function fetchTenders(spaceId: string) {
  const { data, error } = await supabase
    .from("tending")
    .select("tender:profiles!tending_tender_id_fkey(*)")
    .eq("tended_id", spaceId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.tender);
}

/** Spaces this profile tends (following). */
export async function fetchTended(spaceId: string) {
  const { data, error } = await supabase
    .from("tending")
    .select("tended:profiles!tending_tended_id_fkey(*)")
    .eq("tender_id", spaceId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.tended);
}

export async function fetchTendingCounts(spaceId: string) {
  const [{ count: tenders }, { count: tended }] = await Promise.all([
    supabase.from("tending").select("id", { count: "exact", head: true }).eq("tended_id", spaceId),
    supabase.from("tending").select("id", { count: "exact", head: true }).eq("tender_id", spaceId),
  ]);
  return { tenders: tenders ?? 0, tended: tended ?? 0 };
}
