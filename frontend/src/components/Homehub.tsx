import { useEffect, useRef, useState } from "react";
import type { Blurt as BlurtType, Flash, Vault, Profile } from "../types";
import { fetchFlashes } from "../api/Flashes";
import { fetchVaults } from "../api/api.vaults";
import Composer from "./Composer";
import BlurtCard from "./Blurt";
import "./Haven.css";

interface HomeHubProps {
  profile: Profile | null;
  displayName: string;
  feedBlurts: BlurtType[];
  myBlurts: BlurtType[];
  counts: { tenders: number; tended: number };
  onBlurtCreated: (b: BlurtType) => void;
  onFallen: (id: string) => void;
}

type Segment = "all" | "blurt" | "flash" | "vault";

const SEGMENTS: { key: Segment; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "✦" },
  { key: "blurt", label: "Blurts", icon: "💬" },
  { key: "flash", label: "Flashes", icon: "⚡" },
  { key: "vault", label: "Vault", icon: "🔒" },
];

function useGreeting(name: string) {
  const hour = new Date().getHours();
  const part =
    hour < 5 ? "night owl" : hour < 12 ? "morning" : hour < 17 ? "afternoon" : hour < 21 ? "evening" : "night";
  const headline =
    hour < 5
      ? "Still up?"
      : hour < 12
      ? "Good morning"
      : hour < 17
      ? "Good afternoon"
      : hour < 21
      ? "Good evening"
      : "Winding down?";
  return { part, headline, name };
}

const PremiumIcon = {
  Blurt: () => (
    <svg className="btn-premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  Flash: () => (
    <svg className="btn-premium-icon" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z" />
    </svg>
  ),
  Vault: () => (
    <svg className="btn-premium-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <circle cx="12" cy="15" r="1.6" />
    </svg>
  ),
};

function FlashCard({ flash }: { flash: Flash }) {
  return (
    <div className="space-card home-feed-item" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="home-type-badge is-flash">⚡ Flash</span>
        <span style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>@{flash.author.username}</span>
      </div>
      <p style={{ margin: 0, fontSize: 14 }}>{flash.caption}</p>
    </div>
  );
}

function VaultCard({ vault }: { vault: Vault }) {
  return (
    <div className="space-card home-feed-item" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="home-type-badge is-vault">🔒 Vault</span>
        <span style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>@{vault.author.username}</span>
      </div>
      <h4 style={{ margin: "0 0 6px", fontFamily: "Shippori Mincho, serif", fontSize: 16 }}>{vault.title}</h4>
      <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)" }}>{vault.body}</p>
    </div>
  );
}

export default function HomeHub({
  profile,
  displayName,
  feedBlurts,
  myBlurts,
  counts,
  onBlurtCreated,
  onFallen,
}: HomeHubProps) {
  const greeting = useGreeting(displayName);
  const [segment, setSegment] = useState<Segment>("all");
  const [flashes, setFlashes] = useState<Flash[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchFlashes(), fetchVaults()]).then(([f, v]) => {
      if (!cancelled) {
        setFlashes(f);
        setVaults(v);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3200);
    return () => clearTimeout(t);
  }, [notice]);

  const lingeringCount = myBlurts.filter((b) => b.lingering).length;
  const segmentIndex = SEGMENTS.findIndex((s) => s.key === segment);

  const showBlurts = segment === "all" || segment === "blurt";
  const showFlashes = segment === "all" || segment === "flash";
  const showVaults = segment === "all" || segment === "vault";

  function scrollToComposer() {
    composerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="home-hub">
      {/* ---------- HERO ---------- */}
      <div className="home-hero">
        <span className="home-hero-orb" aria-hidden="true" />
        <span className="home-hero-orb is-two" aria-hidden="true" />

        <p className="home-hero-eyebrow">
          <span className="home-hero-eyebrow-dot" aria-hidden="true" />
          Haven · Your Home
        </p>
        <h1 className="home-hero-greeting">
          {greeting.headline}, <em>{displayName}</em>
        </h1>
        <p className="home-hero-sub">
          Everything you've Blurted, Flashed, and kept in your Vault — all in one place, built for how you actually use Haven.
        </p>

        <div className="home-stat-row">
          <div className="home-stat-pill">
            <strong>{counts.tenders}</strong>
            <span>Tenders</span>
          </div>
          <div className="home-stat-pill">
            <strong>{counts.tended}</strong>
            <span>Tended</span>
          </div>
          <div className="home-stat-pill">
            <strong>{lingeringCount}</strong>
            <span>Lingering</span>
          </div>
          <div className="home-stat-pill">
            <strong>{feedBlurts.length}</strong>
            <span>Buzzing now</span>
          </div>
        </div>

        <div className="home-quick-actions">
          <button type="button" className="btn-premium is-solid" onClick={scrollToComposer}>
            <PremiumIcon.Blurt />
            <span>New Blurt</span>
          </button>
          <button
            type="button"
            className="btn-premium is-badge"
            onClick={() => setNotice("Flash is brewing — media-first posts are coming to Haven soon.")}
          >
            <PremiumIcon.Flash />
            <span>New Flash</span>
            <span className="btn-premium-badge">Soon</span>
          </button>
          <button
            type="button"
            className="btn-premium is-badge"
            onClick={() => setNotice("Vault is brewing — a permanent home for your favorite pieces is coming soon.")}
          >
            <PremiumIcon.Vault />
            <span>New Vault</span>
            <span className="btn-premium-badge">Soon</span>
          </button>
        </div>

        {notice && (
          <p
            className="haven-panel-in"
            style={{
              position: "relative",
              zIndex: 1,
              marginTop: 16,
              marginBottom: 0,
              fontSize: 13,
              color: "var(--cherry-deep)",
              background: "rgba(255,255,255,0.75)",
              border: "1px solid var(--line)",
              borderRadius: 999,
              padding: "8px 16px",
              display: "inline-block",
            }}
          >
            {notice}
          </p>
        )}
      </div>

      {/* ---------- COMPOSER ---------- */}
      <div ref={composerRef}>
        <Composer onBlurtCreated={onBlurtCreated} />
      </div>

      {/* ---------- SEGMENTED FILTER ---------- */}
      <div className="home-segmented" role="tablist" aria-label="Filter Home feed by content type">
        <span
          className="home-segment-indicator"
          style={{
            width: `calc((100% - 10px) / ${SEGMENTS.length})`,
            transform: `translateX(${segmentIndex * 100}%)`,
          }}
          aria-hidden="true"
        />
        {SEGMENTS.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={segment === s.key}
            className={`home-segment${segment === s.key ? " active" : ""}`}
            style={{ flex: 1 }}
            onClick={() => setSegment(s.key)}
          >
            <span aria-hidden="true">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* ---------- FEED ---------- */}
      <div className="home-feed">
        {showBlurts &&
          (feedBlurts.length > 0 ? (
            feedBlurts.map((b, i) => (
              <div key={b.id} className="home-feed-item" style={{ animationDelay: `${Math.min(i, 8) * 0.05}s` }}>
                <BlurtCard blurt={b} isOwn={profile?.id === b.author.id} onFallen={onFallen} />
              </div>
            ))
          ) : segment === "blurt" ? (
            <div className="home-empty is-blurt">
              <span className="home-empty-icon" aria-hidden="true">💬</span>
              <h3>No Blurts yet</h3>
              <p>Be the first to say something — Blurts you post show up here for everyone on Haven.</p>
            </div>
          ) : null)}

        {showFlashes &&
          (flashes.length > 0 ? (
            flashes.map((f) => <FlashCard key={f.id} flash={f} />)
          ) : segment === "flash" ? (
            <div className="home-empty is-flash">
              <span className="home-empty-icon" aria-hidden="true">⚡</span>
              <h3>Flash is on its way</h3>
              <p>Quick, media-first bursts that live for a moment then fade. We're still building this one — check back soon.</p>
            </div>
          ) : null)}

        {showVaults &&
          (vaults.length > 0 ? (
            vaults.map((v) => <VaultCard key={v.id} vault={v} />)
          ) : segment === "vault" ? (
            <div className="home-empty is-vault">
              <span className="home-empty-icon" aria-hidden="true">🔒</span>
              <h3>Your Vault is empty</h3>
              <p>Vault is where you'll keep the pieces you never want to lose. This feature is still brewing.</p>
            </div>
          ) : null)}

        {segment === "all" && feedBlurts.length === 0 && flashes.length === 0 && vaults.length === 0 && (
          <div className="home-empty">
            <span className="home-empty-icon" aria-hidden="true">🌸</span>
            <h3>Your Home is quiet</h3>
            <p>Post a Blurt above, or Tend a few Spaces to start seeing activity here.</p>
          </div>
        )}
      </div>
    </div>
  );
}