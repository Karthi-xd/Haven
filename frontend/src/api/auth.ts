import { supabase, withTimeout } from "../lib/supabaseClient";
import type { Profile } from "../types";

/**
 * Generates a Space username from the email's local part so the sign-up
 * form doesn't need to ask for one. Not guaranteed unique on its own — a
 * random 4-digit suffix keeps collisions unlikely, and the duplicate-key
 * catch below handles the rare case where one still happens.
 */
function generateUsernameFromEmail(email: string): string {
  const base =
    email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 15) || "user";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}`;
}

/**
 * Creates this user's Space profile row if it doesn't already exist.
 *
 * IMPORTANT: this must only ever be called while a real session is active.
 * Supabase's Row Level Security checks `auth.uid()` against the row being
 * inserted — and `auth.uid()` is null until there's a live, signed-in
 * session. Right after `signUp()`, there is NOT always a session yet (e.g.
 * when "Confirm email" is turned on in the Supabase project, `signUp`
 * returns a user but no session until the email link is clicked). Inserting
 * at that moment runs as an anonymous request and RLS correctly rejects it
 * — that's the "new row violates row-level security policy" error.
 *
 * The fix is purely about *timing*, not about relaxing any policy: we only
 * ever try to create the row once `supabase.auth.getSession()` (or the
 * signUp/signIn response) confirms a session actually exists.
 */
async function ensureProfile(userId: string, email: string) {
  // Row might already exist (created on a previous call, or by a DB trigger
  // if one is set up on auth.users) — check first instead of assuming.
  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (existing) return;

  const username = generateUsernameFromEmail(email);
  const { error: insertError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username,
      display_name: username,
      bio: "",
      avatar_url: "",
    },
    { onConflict: "id", ignoreDuplicates: true }
  );
  // Ignore duplicate-key races (e.g. a trigger created the row in between).
  if (insertError && insertError.code !== "23505") throw insertError;
}

/**
 * Clean, single-step registration: just email + password.
 * A username/display name is generated automatically from the email.
 *
 * If Supabase returns a session immediately (email confirmation disabled),
 * the Space profile is created right here. If not (email confirmation
 * required), the profile is created the moment a session first exists —
 * i.e. in loginHaven, right after the user confirms their email and logs in.
 */
export async function registerHaven(email: string, password: string) {
  const { data, error } = await withTimeout(
    supabase.auth.signUp({ email, password })
  );
  if (error) throw error;

  if (data.session && data.user) {
    await ensureProfile(data.user.id, email);
  }

  return data;
}

export async function loginHaven(email: string, password: string) {
  const { data, error } = await withTimeout(
    supabase.auth.signInWithPassword({ email, password })
  );
  if (error) throw error;

  // A session is now guaranteed to exist, so it's always safe to make sure
  // the Space profile row is there (covers the "email confirmation was
  // required" case, where registerHaven couldn't create it yet).
  if (data.user) {
    await ensureProfile(data.user.id, email);
  }

  return data;
}

export async function logoutHaven() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function fetchMe(): Promise<Profile | null> {
  const {
    data: { user },
  } = await withTimeout(supabase.auth.getUser());
  if (!user) return null;

  const { data, error } = await withTimeout(
    supabase.from("profiles").select("*").eq("id", user.id).single()
  );
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(profileData: Partial<Pick<Profile, "username" | "display_name" | "avatar_url" | "bio">>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("profiles")
    .update(profileData)
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

/** Turns a Supabase error into a single human-readable string. */
export function getErrorMessage(error: any, fallback: string): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  if (error.message) {
    const msg = error.message as string;
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("network")) {
      return "Can't reach Supabase. Check your internet connection and VITE_SUPABASE_URL, then try again.";
    }
    if (msg.includes("timed out")) {
      return "The connection timed out. Check your internet connection and try again.";
    }
    if (msg.includes("Invalid login credentials")) {
      return "Incorrect email or password.";
    }
    return msg;
  }
  return fallback;
}
