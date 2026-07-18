import { supabase } from "../lib/supabaseClient";
import type { MediaKind, VaultEntry } from "../types";

const TABLE = "vault_entries";

export async function fetchMyVault(authorId: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("author_id", authorId)
    .order("scheduled_for", { ascending: true });
  if (error) throw error;
  return data as VaultEntry[];
}

export async function sealVaultEntry(
  mediaUrl: string,
  mediaKind: MediaKind,
  caption: string,
  scheduledFor: string,
  permanent: boolean
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      author_id: user.id,
      media_url: mediaUrl,
      media_kind: mediaKind,
      caption,
      scheduled_for: scheduledFor,
      permanent,
    })
    .select()
    .single();
  if (error) throw error;
  return data as VaultEntry;
}

/** Breaks a seal early — deletes the entry before it ever opens. */
export async function breakSealEarly(id: string) {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

/**
 * Walks the caller's own sealed entries and, for any whose `scheduled_for`
 * has arrived, materializes them into `flashes` and marks them released.
 * Safe to call often — already-released rows are skipped. This is what
 * makes a Vault entry "open" the moment someone is around to look; for
 * always-on timing, promote `release_due_vault_entries()` (see the
 * migration) to a Supabase scheduled function instead.
 */
export async function releaseDueVaultEntries(authorId: string): Promise<number> {
  const nowIso = new Date().toISOString();
  const { data: due, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("author_id", authorId)
    .eq("released", false)
    .lte("scheduled_for", nowIso);
  if (error || !due || due.length === 0) return 0;

  let released = 0;
  for (const entry of due as VaultEntry[]) {
    const expires_at = entry.permanent ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data: flash, error: flashErr } = await supabase
      .from("flashes")
      .insert({
        author_id: authorId,
        media_url: entry.media_url,
        media_kind: entry.media_kind,
        caption: entry.caption,
        lingering: entry.permanent,
        expires_at,
      })
      .select()
      .single();
    if (flashErr || !flash) continue;

    const { error: updateErr } = await supabase
      .from(TABLE)
      .update({ released: true, released_flash_id: flash.id })
      .eq("id", entry.id);
    if (!updateErr) released += 1;
  }
  return released;
}