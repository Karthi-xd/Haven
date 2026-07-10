import { useMemo, useState } from "react";
import type { Blurt as BlurtType, Flash as FlashType, Vault as VaultType } from "../types";
import FlashCard from "./Flash";
import BlurtCard from "./Blurt";
import VaultCard from "./Vault";
import "./Feed.css";

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
 * Three concepts, three ways of being read: Flashes gather into a bright
 * gallery, Blurts settle into a quiet column of fragments, and Vaults stand
 * in their own ceremonial chamber. "All" weaves Flashes and Blurts into one
 * living thread, newest first, with sealed Vaults surfaced as a shelf above
 * — so switching tabs genuinely feels like stepping into a different room
 * of the same house.
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
      <div className="hv-empty">
        <span className="hv-empty-icon" aria-hidden="true">{c.icon}</span>
        <span className="hv-empty-title">{c.title}</span>
        <span>{c.body}</span>
      </div>
    );
  }

  return (
    <div className="hv-feed">
      <header className="hv-toolbar">
        <div className="hv-pulse-strip">
          <span className="hv-pulse is-live">
            <strong>{liveCount}</strong>&nbsp;live right now
          </span>
          <span className="hv-pulse">
            <strong>{flashes.length}</strong>&nbsp;Flashes
          </span>
          <span className="hv-pulse">
            <strong>{blurts.length}</strong>&nbsp;Blurts
          </span>
          {vaults.length > 0 && (
            <span className="hv-pulse is-gold">
              <strong>{vaults.length}</strong>&nbsp;sealed
            </span>
          )}
        </div>

        <div className="hv-tabs" role="tablist" aria-label="Filter the feed">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              data-kind={f.key}
              onClick={() => setFilter(f.key)}
              className={`hv-tab${filter === f.key ? " is-active" : ""}`}
            >
              <span className="hv-tab-icon" aria-hidden="true">{f.icon}</span>
              {f.label}
              {f.key === "vault" && vaults.length > 0 && <span className="hv-tab-count">· {vaults.length}</span>}
            </button>
          ))}
        </div>
      </header>

      {filter !== "vault" && vaults.length > 0 && (
        <section className="hv-shelf">
          <div className="hv-shelf-head">
            <span className="hv-shelf-title">
              <span aria-hidden="true">🔒</span>Your Sealed Vaults
            </span>
            <span className="hv-shelf-line" aria-hidden="true" />
          </div>
          <div className="hv-shelf-track">
            {vaults.map((v) => (
              <div className="hv-shelf-item" key={`vault-${v.id}`}>
                <VaultCard vault={v} onDeleted={onVaultDeleted} compact />
              </div>
            ))}
          </div>
        </section>
      )}

      {filter === "vault" ? (
        vaults.length === 0 ? (
          renderEmpty()
        ) : (
          <div className="hv-vault-grid">
            {vaults.map((v) => (
              <VaultCard key={`vault-${v.id}`} vault={v} onDeleted={onVaultDeleted} />
            ))}
          </div>
        )
      ) : visibleItems.length === 0 ? (
        renderEmpty()
      ) : filter === "flash" ? (
        <div className="hv-flash-grid">
          {visibleItems.map((item, i) => (
            <div className="hv-flash-grid-item" style={{ ["--i" as any]: i }} key={`flash-${item.data.id}`}>
              <FlashCard flash={item.data as FlashType} onFallen={onFlashFallen} />
            </div>
          ))}
        </div>
      ) : filter === "blurt" ? (
        <div className="hv-blurt-column">
          {visibleItems.map((item, i) => (
            <div className="hv-blurt-column-item" style={{ ["--i" as any]: i }} key={`blurt-${item.data.id}`}>
              <BlurtCard
                blurt={item.data as BlurtType}
                isOwn={item.data.author.id === currentUserId}
                onFallen={onBlurtFallen}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="hv-thread">
          <span className="hv-thread-line" aria-hidden="true" />
          {visibleItems.map((item, i) =>
            item.kind === "flash" ? (
              <div className="hv-thread-row hv-thread-flash" style={{ ["--i" as any]: i }} key={`flash-${item.data.id}`}>
                <span className="hv-thread-node" aria-hidden="true" />
                <FlashCard flash={item.data} onFallen={onFlashFallen} />
              </div>
            ) : (
              <div className="hv-thread-row hv-thread-blurt" style={{ ["--i" as any]: i }} key={`blurt-${item.data.id}`}>
                <span className="hv-thread-node" aria-hidden="true" />
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