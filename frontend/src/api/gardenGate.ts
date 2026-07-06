import { supabase } from "../lib/supabaseClient";
import type { Knock, Message } from "../types";

/** Send a Knock — a pending message request at someone's Garden Gate. */
export async function sendKnock(toId: string, openingMessage: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("knocks")
    .insert({ from_id: user.id, to_id: toId, opening_message: openingMessage, status: "pending" })
    .select()
    .single();
  if (error) throw error;
  return data as Knock;
}

/** Knocks waiting at my Garden Gate for me to approve or decline. */
export async function fetchPendingKnocks() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("knocks")
    .select("*, from:profiles!knocks_from_id_fkey(*)")
    .eq("to_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as unknown as (Knock & { from: any })[];
}

/** Approve a Knock: opens the Gate — creates (or reuses) the Conversation. */
export async function approveKnock(knockId: string) {
  const { data, error } = await supabase.rpc("approve_knock", { knock_id: knockId });
  if (error) throw error;
  return data;
}

export async function declineKnock(knockId: string) {
  const { error } = await supabase.from("knocks").update({ status: "declined" }).eq("id", knockId);
  if (error) throw error;
}

/** Every open (approved) conversation for the current user, most recent first. */
export async function fetchConversations() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("conversations")
    .select("*, a:profiles!conversations_participant_a_fkey(*), b:profiles!conversations_participant_b_fkey(*)")
    .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data;
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data as Message[];
}

export async function sendMessage(conversationId: string, body: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: user.id, body })
    .select()
    .single();
  if (error) throw error;

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data as Message;
}
