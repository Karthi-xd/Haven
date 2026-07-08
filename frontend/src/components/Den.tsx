import { useEffect, useState, type FormEvent } from "react";
import {
  fetchPendingPings,
  approvePing,
  declinePing,
  fetchConversations,
  fetchMessages,
  sendMessage,
} from "../api/den";
import Ping from "./Ping";
import type { Message } from "../types";

/** Den — standard messaging, but every new conversation starts as a Ping to approve. */
export default function Den({ myId }: { myId: string }) {
  const [pings, setPings] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);

  function loadAll() {
    setLoading(true);
    Promise.all([fetchPendingPings(), fetchConversations()])
      .then(([k, c]) => {
        setPings(k);
        setConversations(c ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!activeConvo) return;
    fetchMessages(activeConvo).then(setMessages);
  }, [activeConvo]);

  async function handleApprove(id: string) {
    await approvePing(id);
    loadAll();
  }

  async function handleDecline(id: string) {
    await declinePing(id);
    setPings((prev) => prev.filter((k) => k.id !== id));
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || !activeConvo) return;
    const msg = await sendMessage(activeConvo, trimmed);
    setMessages((prev) => [...prev, msg]);
    setDraft("");
  }

  if (loading) return <p style={{ color: "var(--ink-muted)", fontSize: 13 }}>Opening the Den…</p>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, minHeight: 320 }}>
      <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {pings.length > 0 && (
          <div>
            <h4 style={{ fontSize: 12, color: "var(--cherry)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px" }}>
              Pings waiting
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pings.map((k) => (
                <Ping key={k.id} ping={k} onApprove={handleApprove} onDecline={handleDecline} />
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 style={{ fontSize: 12, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 8px" }}>
            Open conversations
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {conversations.length === 0 && (
              <p style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>No open conversations yet.</p>
            )}
            {conversations.map((c) => {
              const other = c.a?.id === myId ? c.b : c.a;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConvo(c.id)}
                  style={{
                    textAlign: "left",
                    border: "none",
                    background: activeConvo === c.id ? "rgba(196,24,60,0.08)" : "transparent",
                    borderRadius: 10,
                    padding: "8px 10px",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--ink)",
                  }}
                >
                  @{other?.username ?? "unknown"}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <section style={{ display: "flex", flexDirection: "column", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
        {!activeConvo ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-muted)", fontSize: 13 }}>
            Pick a conversation to open it.
          </div>
        ) : (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    alignSelf: m.sender_id === myId ? "flex-end" : "flex-start",
                    background: m.sender_id === myId ? "var(--cherry)" : "#f4f4f4",
                    color: m.sender_id === myId ? "#fff" : "var(--ink)",
                    borderRadius: 14,
                    padding: "8px 14px",
                    fontSize: 13.5,
                    maxWidth: "70%",
                  }}
                >
                  {m.body}
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid var(--line)" }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                style={{ flex: 1, border: "1px solid var(--line)", borderRadius: 999, padding: "8px 14px", fontSize: 13.5 }}
              />
              <button
                type="submit"
                style={{ border: "none", background: "var(--cherry)", color: "#fff", borderRadius: 999, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
