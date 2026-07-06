import { supabase } from "../lib/supabaseClient";

/** Start Tending someone's Garden (follow). */
export async function tendGarden(tendedId: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { error } = await supabase.from("tending").insert({ tender_id: user.id, tended_id: tendedId });
  if (error) throw error;
}

/** Stop Tending someone's Garden (unfollow). */
export async function untendGarden(tendedId: string) {
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

/** People tending this Garden (followers). */
export async function fetchTenders(gardenId: string) {
  const { data, error } = await supabase
    .from("tending")
    .select("tender:profiles!tending_tender_id_fkey(*)")
    .eq("tended_id", gardenId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.tender);
}

/** Gardens this profile tends (following). */
export async function fetchTended(gardenId: string) {
  const { data, error } = await supabase
    .from("tending")
    .select("tended:profiles!tending_tended_id_fkey(*)")
    .eq("tender_id", gardenId);
  if (error) throw error;
  return (data ?? []).map((row: any) => row.tended);
}

export async function fetchTendingCounts(gardenId: string) {
  const [{ count: tenders }, { count: tended }] = await Promise.all([
    supabase.from("tending").select("id", { count: "exact", head: true }).eq("tended_id", gardenId),
    supabase.from("tending").select("id", { count: "exact", head: true }).eq("tender_id", gardenId),
  ]);
  return { tenders: tenders ?? 0, tended: tended ?? 0 };
}
