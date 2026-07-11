import { supabase } from "../lib/supabaseClient";
import type { Blurt } from "../types";

export async function fetchBlurts(limit = 30) {
  const { data, error } = await supabase
    .from("whispers_with_counts")
    .select("*")
    .eq("fallen", false)
    .order("posted_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as Blurt[];
}

export async function fetchSpaceBlurts(authorId: string) {
  const { data, error } = await supabase
    .from("whispers_with_counts")
    .select("*")
    .eq("author_id", authorId)
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return data as Blurt[];
}

export async function createBlurt(body: string) {
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
  return data as Blurt;
}

/** Let it linger: stops the 24h countdown and makes the Blurt permanent on the Space. */
export async function letBlurtLinger(id: string) {
  const { data, error } = await supabase
    .from("whispers")
    .update({ lingering: true, expires_at: null })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Blurt;
}

export async function deleteBlurt(id: string) {
  const { error } = await supabase.from("whispers").delete().eq("id", id);
  if (error) throw error;
}
