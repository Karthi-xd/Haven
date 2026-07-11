interface PingProps {
  ping: {
    id: string;
    opening_message: string;
    from: { username: string; display_name: string; avatar_url: string };
  };
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}

/** A pending Ping — approve to open the Den, decline to leave it closed. */
export default function Ping({ ping, onApprove, onDecline }: PingProps) {
  return (
    <div className="ping-card">
      <span className="post-avatar ping-avatar" aria-hidden="true">
        {ping.from.avatar_url ? (
          <img src={ping.from.avatar_url} alt="" />
        ) : (
          <span className="den-convo-avatar-fallback">🌸</span>
        )}
      </span>
      <div className="ping-info">
        <div className="ping-name">@{ping.from.username}</div>
        <div className="ping-message">{ping.opening_message}</div>
      </div>
      <div className="ping-actions">
        <button type="button" onClick={() => onApprove(ping.id)} className="btn is-solid is-sm">
          Open the Den
        </button>
        <button type="button" onClick={() => onDecline(ping.id)} className="btn is-sm is-quiet">
          Decline
        </button>
      </div>
    </div>
  );
}