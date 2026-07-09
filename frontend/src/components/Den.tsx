import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  fetchPendingPings,
  approvePing,
  declinePing,
  fetchConversations,
  fetchLatestMessages,
  fetchMessages,
  sendMessage,
  openConversationChannel,
  subscribeToPresence,
} from "../api/den";
import Ping from "./Ping";
import type { Message, Profile } from "../types";

type ConvoRow = {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string | null;
  a: Profile;
  b: Profile;
};

const EMOJI = ["🌸", "😀", "😂", "❤️", "👍", "🎉", "🔥", "🥲", "😢", "🙏", "✨", "😴"];
const READ_KEY_PREFIX = "haven-den-read:";

type Ripple = { id: number; x: number; y: number };

/** Same click-point ripple used on the landing CTA and the composer — kept the send button in the same family. */
function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  function trigger(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setRipples((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 700);
  }
  const layer = (
    <span className="cta-ripple-layer" aria-hidden="true">
      {ripples.map((r) => (
        <span key={r.id} className="cta-ripple" style={{ left: r.x, top: r.y }} />
      ))}
    </span>
  );
  return { trigger, layer };
}

function readKey(myId: string, conversationId: string) {
  return `${READ_KEY_PREFIX}${myId}:${conversationId}`;
}

function isUnread(myId: string, convo: ConvoRow, lastMessage?: Message) {
  if (!convo.last_message_at) return false;
  if (lastMessage && lastMessage.sender_id === myId) return false;
  const lastRead = localStorage.getItem(readKey(myId, convo.id));
  if (!lastRead) return true;
  return new Date(convo.last_message_at).getTime() > new Date(lastRead).getTime();
}

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function dateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

function relativeTime(iso: string | null) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Den — standard messaging, but every new conversation starts as a Ping to approve. */
export default function Den({ myId }: { myId: string }) {
  const [pings, setPings] = useState<any[]>([]);
  const [conversations, setConversations] = useState<ConvoRow[]>([]);
  const [previews, setPreviews] = useState<Record<string, Message>>({});
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [convoLoading, setConvoLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [typingFrom, setTypingFrom] = useState<string | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [sending, setSending] = useState(false);
  const [readTick, setReadTick] = useState(0);
  const sendRipple = useRipple();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);
  const channelRef = useRef<ReturnType<typeof openConversationChannel> | null>(null);

  function loadAll() {
    setLoading(true);
    Promise.all([fetchPendingPings(), fetchConversations()])
      .then(async ([k, c]) => {
        setPings(k);
        const rows = (c ?? []) as ConvoRow[];
        setConversations(rows);
        const latest = await fetchLatestMessages(rows.map((r) => r.id));
        setPreviews(latest);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Presence — who else is currently around, shown as a green dot on their avatar.
  useEffect(() => {
    const unsubscribe = subscribeToPresence(myId, setOnlineIds);
    return unsubscribe;
  }, [myId]);

  // Open a realtime channel for whichever conversation is active: live
  // message delivery + ephemeral typing broadcasts. Torn down on switch.
  useEffect(() => {
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setTypingFrom(null);

    if (!activeConvo) return;

    setConvoLoading(true);
    fetchMessages(activeConvo)
      .then(setMessages)
      .finally(() => setConvoLoading(false));

    localStorage.setItem(readKey(myId, activeConvo), new Date().toISOString());
    setReadTick((n) => n + 1);

    const channel = openConversationChannel(activeConvo, {
      onMessage: (m) => {
        setMessages((prev) => (prev.some((existing) => existing.id === m.id) ? prev : [...prev, m]));
        if (m.sender_id !== myId) {
          localStorage.setItem(readKey(myId, activeConvo), new Date().toISOString());
        } else {
          setPreviews((prev) => ({ ...prev, [activeConvo]: m }));
        }
        setTypingFrom(null);
      },
      onTyping: (fromUserId) => {
        if (fromUserId === myId) return;
        setTypingFrom(fromUserId);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingFrom(null), 2500);
      },
    });
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvo, myId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingFrom]);

  async function handleApprove(id: string) {
    await approvePing(id);
    loadAll();
  }

  async function handleDecline(id: string) {
    await declinePing(id);
    setPings((prev) => prev.filter((k) => k.id !== id));
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
    const now = Date.now();
    if (activeConvo && channelRef.current && now - lastTypingSentRef.current > 1200) {
      lastTypingSentRef.current = now;
      channelRef.current.broadcastTyping(myId);
    }
  }

  function insertEmoji(emoji: string) {
    handleDraftChange(draft + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !activeConvo || sending) return;
    setSending(true);
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      const msg = await sendMessage(activeConvo, trimmed);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setPreviews((prev) => ({ ...prev, [activeConvo]: msg }));
      setConversations((prev) => {
        const updated = prev.map((c) => (c.id === activeConvo ? { ...c, last_message_at: msg.created_at } : c));
        return [...updated].sort((a, b) => new Date(b.last_message_at ?? 0).getTime() - new Date(a.last_message_at ?? 0).getTime());
      });
    } catch {
      setDraft(trimmed);
    } finally {
      setSending(false);
    }
  }

  function handleComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as unknown as FormEvent);
    }
  }

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const other = c.a?.id === myId ? c.b : c.a;
      return (
        other?.username?.toLowerCase().includes(q) ||
        other?.display_name?.toLowerCase().includes(q)
      );
    });
  }, [conversations, search, myId]);

  const activeOther = useMemo(() => {
    const convo = conversations.find((c) => c.id === activeConvo);
    if (!convo) return null;
    return convo.a?.id === myId ? convo.b : convo.a;
  }, [conversations, activeConvo, myId]);

  const groupedMessages = useMemo(() => {
    const groups: { label: string; items: Message[] }[] = [];
    for (const m of messages) {
      const label = dateLabel(m.created_at);
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(m);
      else groups.push({ label, items: [m] });
    }
    return groups;
  }, [messages]);

  if (loading) {
    return (
      <div className="den-loading">
        <span className="den-loading-petal" aria-hidden="true">🌸</span>
        Opening the Den…
      </div>
    );
  }

  return (
    <div className="den-shell">
      {/* SIDEBAR */}
      <aside className="den-sidebar">
        {pings.length > 0 && (
          <div className="den-pings">
            <h4 className="den-section-title den-section-title-accent">Pings waiting</h4>
            <div className="den-pings-list">
              {pings.map((k) => (
                <Ping key={k.id} ping={k} onApprove={handleApprove} onDecline={handleDecline} />
              ))}
            </div>
          </div>
        )}

        <div className="den-search-wrap">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="den-search-icon">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className="den-search-input"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="den-convo-scroll">
          <h4 className="den-section-title">Conversations</h4>
          {filteredConversations.length === 0 && (
            <p className="den-empty-hint">
              {conversations.length === 0
                ? "No open conversations yet. Approve a Ping to start one."
                : "No conversations match your search."}
            </p>
          )}
          <div className="den-convo-list">
            {filteredConversations.map((c) => {
              const other = c.a?.id === myId ? c.b : c.a;
              const preview = previews[c.id];
              const unread = isUnread(myId, c, preview);
              const online = other && onlineIds.has(other.id);
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConvo(c.id)}
                  className={`den-convo-item${activeConvo === c.id ? " active" : ""}${unread ? " unread" : ""}`}
                >
                  <span className="den-convo-avatar">
                    {other?.avatar_url ? (
                      <img src={other.avatar_url} alt="" />
                    ) : (
                      <span className="den-convo-avatar-fallback">🌸</span>
                    )}
                    {online && <span className="den-online-dot" title="Online" />}
                  </span>
                  <span className="den-convo-meta">
                    <span className="den-convo-top-row">
                      <span className="den-convo-name">{other?.display_name || other?.username || "unknown"}</span>
                      {c.last_message_at && <span className="den-convo-time">{relativeTime(c.last_message_at)}</span>}
                    </span>
                    <span className="den-convo-preview">
                      {preview ? (preview.sender_id === myId ? `You: ${preview.body}` : preview.body) : "Say hello 👋"}
                    </span>
                  </span>
                  {unread && <span className="den-unread-dot" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* CHAT PANE */}
      <section className="den-chat">
        {!activeConvo ? (
          <div className="den-chat-empty">
            <span className="den-chat-empty-art" aria-hidden="true">🌿</span>
            <h3>Pick a conversation</h3>
            <p>Choose someone from the left to open your Den with them.</p>
          </div>
        ) : (
          <>
            <header className="den-chat-header">
              <span className="den-chat-header-avatar">
                {activeOther?.avatar_url ? (
                  <img src={activeOther.avatar_url} alt="" />
                ) : (
                  <span className="den-convo-avatar-fallback">🌸</span>
                )}
                {activeOther && onlineIds.has(activeOther.id) && <span className="den-online-dot" />}
              </span>
              <div>
                <div className="den-chat-header-name">{activeOther?.display_name || activeOther?.username}</div>
                <div className="den-chat-header-sub">
                  {typingFrom
                    ? "typing…"
                    : activeOther && onlineIds.has(activeOther.id)
                    ? "Online"
                    : `@${activeOther?.username ?? "unknown"}`}
                </div>
              </div>
            </header>

            <div className="den-messages" key={readTick}>
              {convoLoading ? (
                <div className="den-chat-empty small">
                  <span className="den-loading-petal" aria-hidden="true">🌸</span>
                  Loading messages…
                </div>
              ) : messages.length === 0 ? (
                <div className="den-chat-empty small">
                  <span className="den-chat-empty-art" aria-hidden="true">💬</span>
                  <p>No messages yet — say hello!</p>
                </div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.label}>
                    <div className="den-date-divider">
                      <span>{group.label}</span>
                    </div>
                    {group.items.map((m, idx) => {
                      const mine = m.sender_id === myId;
                      const next = group.items[idx + 1];
                      const isLastOfRun = !next || next.sender_id !== m.sender_id;
                      return (
                        <div key={m.id} className={`den-msg-row${mine ? " mine" : ""}${isLastOfRun ? " is-tail" : ""}`}>
                          {!mine && (
                            <span className={`den-msg-avatar${isLastOfRun ? "" : " is-spacer"}`} aria-hidden="true">
                              {isLastOfRun &&
                                (activeOther?.avatar_url ? (
                                  <img src={activeOther.avatar_url} alt="" />
                                ) : (
                                  <span className="den-convo-avatar-fallback">🌸</span>
                                ))}
                            </span>
                          )}
                          <div className={`den-bubble${mine ? " mine" : ""}${isLastOfRun ? " is-tail" : ""}`}>
                            {m.body}
                            <span className="den-bubble-time">{formatClock(m.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              {typingFrom && (
                <div className="den-msg-row">
                  <span className="den-msg-avatar" aria-hidden="true">
                    {activeOther?.avatar_url ? (
                      <img src={activeOther.avatar_url} alt="" />
                    ) : (
                      <span className="den-convo-avatar-fallback">🌸</span>
                    )}
                  </span>
                  <div className="den-bubble den-typing-bubble">
                    <span className="den-typing-dot" />
                    <span className="den-typing-dot" />
                    <span className="den-typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="den-composer">
              {showEmoji && (
                <div className="den-emoji-popover">
                  {EMOJI.map((em) => (
                    <button type="button" key={em} onClick={() => insertEmoji(em)} className="den-emoji-btn">
                      {em}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="den-emoji-toggle"
                onClick={() => setShowEmoji((v) => !v)}
                aria-label="Add an emoji"
              >
                🌸
              </button>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
                rows={1}
                className="den-composer-input"
              />
              <button
                type="submit"
                className="den-send-btn"
                disabled={!draft.trim() || sending}
                onClick={(e) => sendRipple.trigger(e)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M3 11.5 20.5 3l-6 17.5-4-7.5-7.5-1.5Z" />
                </svg>
                {sendRipple.layer}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}