import { supabase } from "../lib/supabaseClient";
import type { Vault } from "../types";

/**
 * Vault is a planned feature (the renamed "Bloom") — a permanent, curated
 * piece a user chooses to keep forever. The `vaults` table doesn't exist in
 * Supabase yet, so these calls fail soft and return an empty list instead of
 * throwing, which lets the Home tab render its premium empty state instead
 * of crashing. Once the `vaults` table is created, this starts returning
 * real rows with no changes needed on the UI side.
 */
export async function fetchVaults(limit = 20): Promise<Vault[]> {
  try {
    const { data, error } = await supabase
      .from("vaults")
      .select("*")
      .order("saved_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as Vault[];
  } catch {
    return [];
  }
}

export async function createVault(title: string, body: string, coverUrl: string | null = null): Promise<Vault> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("vaults")
    .insert({ author_id: user.id, title, body, cover_url: coverUrl })
    .select()
    .single();
  if (error) throw error;
  return data as Vault;
}