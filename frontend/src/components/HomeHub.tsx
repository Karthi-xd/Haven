import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { fetchBlurts } from "../api/blurts";
import type { Blurt, Profile } from "../types";

interface HomeHubProps {
  profile: Profile;
  lingeringCount: number;
  tenders: number;
  tended: number;
  onNavigate: (tab: "space" | "trail" | "den" | "settings") => void;
}

type Segment = "all" | "blurt" | "flash" | "vault";

const SEGMENTS: { key: Segment; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "✨" },
  { key: "blurt", label: "Blurts", icon: "🌿" },
  { key: "flash", label: "Flash", icon: "⚡" },
  { key: "vault", label: "Vault", icon: "🔒" },
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function greetingFor(hour: number): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export default function HomeHub({ profile, lingeringCount, tenders, tended, onNavigate }: HomeHubProps) {
  const [segment, setSegment] = useState<Segment>("all");
  const [blurts, setBlurts] = useState<Blurt[] | null>(null);

  const segRefs = useRef<Record<Segment, HTMLButtonElement | null>>({
    all: null,
    blurt: null,
    flash: null,
    vault: null,
  });
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    let cancelled = false;
    fetchBlurts(12)
      .then((data) => {
        if (!cancelled) setBlurts(data);
      })
      .catch(() => {
        if (!cancelled) setBlurts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const el = segRefs.current[segment];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [segment, blurts]);

  const hour = new Date().getHours();
  const showFlashEmpty = segment === "flash";
  const showVaultEmpty = segment === "vault";
  const showBlurtFeed = segment === "all" || segment === "blurt";

  return (
    <div className="home-hub haven-panel-in">
      <section className="home-hero">
        <span className="home-hero-orb" aria-hidden="true" />
        <span className="home-hero-orb is-two" aria-hidden="true" />

        <p className="home-hero-eyebrow">
          <span className="home-hero-eyebrow-dot" aria-hidden="true" />
          Welcome back
        </p>
        <h1 className="home-hero-greeting">
          {greetingFor(hour)}, <em>{profile.display_name || profile.username}</em>
        </h1>
        <p className="home-hero-sub">
          Here's what's been growing in your Space since you last stopped by.
        </p>

        <div className="home-stat-row">
          <div className="home-stat-pill">
            <strong>{lingeringCount}</strong>
            <span>Lingering</span>
          </div>
          <div className="home-stat-pill">
            <strong>{tenders}</strong>
            <span>Tenders</span>
          </div>
          <div className="home-stat-pill">
            <strong>{tended}</strong>
            <span>Tended</span>
          </div>
        </div>

        <div className="home-quick-actions">
          <button type="button" className="btn-premium is-solid is-sm" onClick={() => onNavigate("trail")}>
            <span className="btn-premium-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
            New Blurt
          </button>
          <button type="button" className="btn-premium is-sm" onClick={() => onNavigate("space")}>
            My Space
          </button>
          <button type="button" className="btn-premium is-sm" onClick={() => onNavigate("den")}>
            Open Den
          </button>
        </div>
      </section>

      <div className="home-segmented" role="tablist" aria-label="Content type">
        <span
          className="home-segment-indicator"
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
          aria-hidden="true"
        />
        {SEGMENTS.map((s) => (
          <button
            key={s.key}
            ref={(el) => {
              segRefs.current[s.key] = el;
            }}
            type="button"
            role="tab"
            aria-selected={segment === s.key}
            className={`home-segment${segment === s.key ? " active" : ""}`}
            onClick={() => setSegment(s.key)}
          >
            <span aria-hidden="true">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {showBlurtFeed && (
        <div className="home-feed">
          {blurts === null && (
            <div className="home-empty">
              <span className="home-empty-icon" aria-hidden="true">🌸</span>
              <h3>Gathering the Trail…</h3>
              <p>Just a moment while today's Blurts settle into place.</p>
            </div>
          )}

          {blurts !== null && blurts.length === 0 && (
            <div className="home-empty">
              <span className="home-empty-icon" aria-hidden="true">🌱</span>
              <h3>It's quiet out there</h3>
              <p>No Blurts are drifting through Haven right now. Be the first to plant one on your Trail.</p>
              <button type="button" className="btn-premium is-solid is-sm" onClick={() => onNavigate("trail")}>
                Start a Blurt
              </button>
            </div>
          )}

          {blurts !== null &&
            blurts.map((b, i) => (
              <article key={b.id} className="home-feed-item" style={{ ["--i" as any]: i }}>
                <div className="space-card" style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <img
                        src={b.author?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=haven"}
                        alt={b.author?.display_name || "Explorer"}
                        style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {b.author?.display_name || "Explorer"}
                        </p>
                        <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-muted)" }}>@{b.author?.username} · {timeAgo(b.posted_at)}</p>
                      </div>
                    </div>
                    <span className={`home-type-badge is-blurt`}>🌿 Blurt</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 14.5, color: "var(--ink)", lineHeight: 1.55 }}>{b.body}</p>
                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--ink-muted)" }}>
                    <span>🔥 {b.buzz_count}</span>
                    <span>✨ {b.spark_count}</span>
                    <span>💬 {b.chime_count}</span>
                  </div>
                </div>
              </article>
            ))}
        </div>
      )}

      {showFlashEmpty && (
        <div className="home-empty is-flash">
          <span className="home-empty-icon" aria-hidden="true">⚡</span>
          <h3>Flash is on its way</h3>
          <p>Quick, media-first bursts are coming to Haven soon — check back for this space to light up.</p>
        </div>
      )}

      {showVaultEmpty && (
        <div className="home-empty is-vault">
          <span className="home-empty-icon" aria-hidden="true">🔒</span>
          <h3>Vault is still sealed</h3>
          <p>Soon you'll be able to keep the pieces that matter most, saved here for good.</p>
        </div>
      )}
    </div>
  );
}