import { supabase } from "../lib/supabaseClient";
import type { Ping, Message } from "../types";

/** Send a Ping — a pending message request at someone's Den. */
export async function sendPing(toId: string, openingMessage: string) {
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
  return data as Ping;
}

/** Pings waiting at my Den for me to approve or decline. */
export async function fetchPendingPings() {
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
  return data as unknown as (Ping & { from: any })[];
}

/** Approve a Ping: opens the Den — creates (or reuses) the Conversation. */
export async function approvePing(pingId: string) {
  const { data, error } = await supabase.rpc("approve_knock", { knock_id: pingId });
  if (error) throw error;
  return data;
}

export async function declinePing(pingId: string) {
  const { error } = await supabase.from("knocks").update({ status: "declined" }).eq("id", pingId);
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

/**
 * The single most recent message in each of the given conversations, keyed
 * by conversation_id. Used to render an inbox-style preview line under each
 * conversation without a per-conversation round trip.
 */
export async function fetchLatestMessages(conversationIds: string[]) {
  if (conversationIds.length === 0) return {} as Record<string, Message>;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const latest: Record<string, Message> = {};
  for (const m of data as Message[]) {
    if (!latest[m.conversation_id]) latest[m.conversation_id] = m;
  }
  return latest;
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

/**
 * Opens one realtime channel per active conversation that both streams
 * newly-inserted messages (so replies land live) and carries ephemeral
 * "typing…" broadcasts between the two participants. Nothing here touches
 * the database — typing pings are broadcast-only and never persisted.
 * Returns `{ broadcastTyping, unsubscribe }`; always call unsubscribe on
 * cleanup or when switching conversations.
 */
export function openConversationChannel(
  conversationId: string,
  handlers: { onMessage: (message: Message) => void; onTyping: (fromUserId: string) => void }
) {
  const channel = supabase
    .channel(`den-convo-${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => handlers.onMessage(payload.new as Message)
    )
    .on("broadcast", { event: "typing" }, (payload) => {
      const fromUserId = payload.payload?.userId;
      if (fromUserId) handlers.onTyping(fromUserId);
    })
    .subscribe();

  return {
    broadcastTyping(userId: string) {
      channel.send({ type: "broadcast", event: "typing", payload: { userId } });
    },
    unsubscribe() {
      supabase.removeChannel(channel);
    },
  };
}

/**
 * A lightweight "who's around right now" presence channel shared by every
 * open Den. Call once per session; returns an unsubscribe function. onSync
 * fires with the current set of online user ids whenever presence changes.
 */
export function subscribeToPresence(myId: string, onSync: (onlineIds: Set<string>) => void) {
  const channel = supabase.channel("den-presence", { config: { presence: { key: myId } } });

  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      onSync(new Set(Object.keys(state)));
    })
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        channel.track({ online_at: new Date().toISOString() });
      }
    });

  return () => {
    supabase.removeChannel(channel);
  };
}