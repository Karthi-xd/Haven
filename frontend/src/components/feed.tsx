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
    return <p className="feed-empty">Nothing's alive right now — be the first to plant something today.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 640 }}>
      {items.map((item) =>
        item.kind === "flash" ? (
          <FlashCard key={`flash-${item.data.id}`} flash={item.data} onFallen={onFlashFallen} />
        ) : (
          <BlurtCard
            key={`blurt-${item.data.id}`}
            blurt={item.data}
            isOwn={item.data.author.id === currentUserId}
            onFallen={onBlurtFallen}
          />
        )
      )}
    </div>
  );
}
