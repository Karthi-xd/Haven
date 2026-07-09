import { useMemo } from "react";
import type { Blurt as BlurtType, Flash as FlashType } from "../types";
import FlashCard from "./Flash";
import BlurtCard from "./Blurt";

interface FeedProps {
  flashes: FlashType[];
  blurts: BlurtType[];
  currentUserId?: string;
  onFlashFallen?: (id: string) => void;
  onBlurtFallen?: (id: string) => void;
}

type FeedItem = ({ kind: "flash"; data: FlashType } | { kind: "blurt"; data: BlurtType }) & { postedAt: number };

/**
 * Weaves Flashes and Blurts into a single feed, newest first — so the
 * timeline reads as one living stream instead of two stacked lists, and
 * everything fades and falls on its own 24h clock right where it sits.
 */
export default function Feed({ flashes, blurts, currentUserId, onFlashFallen, onBlurtFallen }: FeedProps) {
  const items = useMemo<FeedItem[]>(() => {
    const flashItems: FeedItem[] = flashes.map((f) => ({ kind: "flash", data: f, postedAt: new Date(f.posted_at).getTime() }));
    const blurtItems: FeedItem[] = blurts.map((w) => ({ kind: "blurt", data: w, postedAt: new Date(w.posted_at).getTime() }));
    return [...flashItems, ...blurtItems].sort((a, b) => b.postedAt - a.postedAt);
  }, [flashes, blurts]);

  if (items.length === 0) {
    return (
      <div className="feed-empty">
        <span style={{ fontSize: 30 }} aria-hidden="true">🌸</span>
        <span className="feed-empty-title">Nothing's alive right now</span>
        <span>Be the first to Blurt or Flash something today.</span>
      </div>
    );
  }

  return (
    <div className="feed-shell">
      {items.map((item, i) =>
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
  );
}
