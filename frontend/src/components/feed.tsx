import { useMemo, useState } from "react";
import type { Blurt as BlurtType, Flash as FlashType, Vault as VaultType } from "../types";
import FlashCard from "./Flash";
import BlurtCard from "./Blurt";
import VaultCard from "./Vault";

interface FeedProps {
  flashes: FlashType[];
  blurts: BlurtType[];
  /** The signed-in user's own sealed Vaults — nobody else's are visible while sealed. */
  vaults?: VaultType[];
  currentUserId?: string;
  onFlashFallen?: (id: string) => void;
  onBlurtFallen?: (id: string) => void;
  onVaultDeleted?: (id: string) => void;
}

type FeedKind = "all" | "flash" | "blurt" | "vault";

type FeedItem = ({ kind: "flash"; data: FlashType } | { kind: "blurt"; data: BlurtType }) & { postedAt: number };

const FILTERS: { key: FeedKind; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "🌸" },
  { key: "flash", label: "Flash", icon: "⚡" },
  { key: "blurt", label: "Blurt", icon: "💬" },
  { key: "vault", label: "Vault", icon: "🔒" },
];

/**
 * Weaves Flashes and Blurts into a single feed, newest first — so the
 * timeline reads as one living stream instead of two stacked lists, and
 * everything fades and falls on its own 24h clock right where it sits.
 * Sealed Vaults surface too: as a horizontal shelf up top, or their own
 * dedicated view when that filter is selected.
 */
export default function Feed({
  flashes,
  blurts,
  vaults = [],
  currentUserId,
  onFlashFallen,
  onBlurtFallen,
  onVaultDeleted,
}: FeedProps) {
  const [filter, setFilter] = useState<FeedKind>("all");

  const items = useMemo<FeedItem[]>(() => {
    const flashItems: FeedItem[] = flashes.map((f) => ({ kind: "flash", data: f, postedAt: new Date(f.posted_at).getTime() }));
    const blurtItems: FeedItem[] = blurts.map((w) => ({ kind: "blurt", data: w, postedAt: new Date(w.posted_at).getTime() }));
    return [...flashItems, ...blurtItems].sort((a, b) => b.postedAt - a.postedAt);
  }, [flashes, blurts]);

  const visibleItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "flash") return items.filter((i) => i.kind === "flash");
    if (filter === "blurt") return items.filter((i) => i.kind === "blurt");
    return [];
  }, [items, filter]);

  const liveCount = flashes.filter((f) => !f.fallen).length + blurts.filter((b) => !b.fallen || b.lingering).length;

  function renderEmpty() {
    const copy: Record<FeedKind, { icon: string; title: string; body: string }> = {
      all: { icon: "🌸", title: "Nothing's alive right now", body: "Be the first to Blurt or Flash something today." },
      flash: { icon: "⚡", title: "No Flashes yet", body: "Photos and clips posted today will light up here." },
      blurt: { icon: "💬", title: "No Blurts yet", body: "Short thoughts posted today will land here." },
      vault: { icon: "🔒", title: "Nothing sealed away", body: "Vaults you create will count down here until they open." },
    };
    const c = copy[filter];
    return (
      <div className="feed-empty">
        <span className="feed-empty-icon" aria-hidden="true">{c.icon}</span>
        <span className="feed-empty-title">{c.title}</span>
        <span>{c.body}</span>
      </div>
    );
  }

  return (
    <div className="feed-shell-wrap">
      <div className="feed-stat-strip">
        <span className="feed-stat-pill"><strong>{liveCount}</strong>&nbsp;live right now</span>
        <span className="feed-stat-pill"><strong>{flashes.length}</strong>&nbsp;Flashes</span>
        <span className="feed-stat-pill"><strong>{blurts.length}</strong>&nbsp;Blurts</span>
        {vaults.length > 0 && (
          <span className="feed-stat-pill is-gold"><strong>{vaults.length}</strong>&nbsp;sealed Vaults</span>
        )}
      </div>

      <div className="feed-filter-bar" role="tablist" aria-label="Filter the feed">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            data-kind={f.key}
            onClick={() => setFilter(f.key)}
            className={`feed-filter-pill${filter === f.key ? " is-active" : ""}`}
          >
            <span className="ffp-icon" aria-hidden="true">{f.icon}</span>
            {f.label}
            {f.key === "vault" && vaults.length > 0 && <span className="ffp-count">· {vaults.length}</span>}
          </button>
        ))}
      </div>

      {filter !== "vault" && vaults.length > 0 && (
        <div className="vault-shelf">
          <div className="vault-shelf-header">
            <span className="vault-shelf-title">
              <span aria-hidden="true">🔒</span>Your Sealed Vaults
            </span>
            <span className="vault-shelf-line" aria-hidden="true" />
          </div>
          <div className="vault-shelf-track">
            {vaults.map((v) => (
              <div className="vault-shelf-item" key={`vault-${v.id}`}>
                <VaultCard vault={v} onDeleted={onVaultDeleted} compact />
              </div>
            ))}
          </div>
        </div>
      )}

      {filter === "vault" ? (
        vaults.length === 0 ? (
          renderEmpty()
        ) : (
          <div className="vault-chamber-grid">
            {vaults.map((v) => (
              <VaultCard key={`vault-${v.id}`} vault={v} onDeleted={onVaultDeleted} />
            ))}
          </div>
        )
      ) : visibleItems.length === 0 ? (
        renderEmpty()
      ) : (
        <div className="feed-shell">
          {visibleItems.map((item, i) =>
            item.kind === "flash" ? (
              <div className="feed-item" style={{ ["--i" as any]: i }} key={`flash-${item.data.id}`}>
                <FlashCard flash={item.data} onFallen={onFlashFallen} />
              </div>
            ) : (
              <div className="feed-item" style={{ ["--i" as any]: i }} key={`blurt-${item.data.id}`}>
                <BlurtCard
                  blurt={item.data}
                  isOwn={item.data.author.id === currentUserId}
                  onFallen={onBlurtFallen}
                />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}