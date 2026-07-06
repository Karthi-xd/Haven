import { supabase } from "../lib/supabaseClient";
import type { Whisper } from "../types";

export async function fetchWhisperFeed(limit = 30) {
  const { data, error } = await supabase
    .from("whispers_with_counts")
    .select("*")
    .eq("fallen", false)
    .order("posted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Whisper[];
}

export async function fetchGardenWhispers(authorId: string) {
  const { data, error } = await supabase
    .from("whispers_with_counts")
    .select("*")
    .eq("author_id", authorId)
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return data as Whisper[];
}

export async function createWhisper(body: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("whispers")
    .insert({ author_id: user.id, body, lingering: false })
    .select()
    .single();
  if (error) throw error;
  return data as Whisper;
}

/** Let it linger: stops the 24h countdown and makes the Whisper permanent on the Garden. */
export async function letWhisperLinger(id: string) {
  const { data, error } = await supabase
    .from("whispers")
    .update({ lingering: true, expires_at: null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Whisper;
}

export async function deleteWhisper(id: string) {
  const { error } = await supabase.from("whispers").delete().eq("id", id);
  if (error) throw error;
}
