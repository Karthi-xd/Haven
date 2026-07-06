interface KnockProps {
  knock: {
    id: string;
    opening_message: string;
    from: { username: string; display_name: string; avatar_url: string };
  };
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}

/** A pending Knock — approve to open the Gate, decline to leave it closed. */
export default function Knock({ knock, onApprove, onDecline }: KnockProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        border: "1px solid var(--line)",
        borderRadius: 16,
        padding: 14,
        background: "#fff",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#eee" }}>
        {knock.from.avatar_url && (
          <img src={knock.from.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--ink)" }}>@{knock.from.username}</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {knock.opening_message}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={() => onApprove(knock.id)}
          style={{ border: "none", background: "var(--cherry)", color: "#fff", borderRadius: 999, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          Open the Gate
        </button>
        <button
          type="button"
          onClick={() => onDecline(knock.id)}
          style={{ border: "1px solid var(--line)", background: "transparent", color: "var(--ink-muted)", borderRadius: 999, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
