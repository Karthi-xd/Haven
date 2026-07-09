import { useEffect, useState, type ReactElement } from "react";
import { fetchMe } from "../api/auth";
import { fetchSpaceFlashes } from "../api/flashes";
import { fetchSpaceBlurts } from "../api/blurts";
import { fetchFlashFeed } from "../api/flashes";
import { fetchBlurtFeed } from "../api/blurts";
import { fetchMyVaults } from "../api/vaults";
import { fetchTendingCounts } from "../api/tending";
import type { Profile, Flash as FlashType, Blurt as BlurtType, Vault as VaultType } from "../types";
import LoadingScene from "./LoadingScene";
import Wake from "./Wake";
import SpaceGrid from "./SpaceGrid";
import Trail from "./Trail";
import Den from "./Den";
import Composer from "./Composer";
import FlashCard from "./Flash";
import VaultCard from "./Vault";
import Feed from "./feed";
import ProfileSettings from "./ProfileSettings";

interface SpaceProps {
  onLogout: () => void;
}

type Tab = "feed" | "space" | "trail" | "den" | "settings";

export default function Space({ onLogout }: SpaceProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("feed");

  const [myFlashes, setMyFlashes] = useState<FlashType[]>([]);
  const [myBlurts, setMyBlurts] = useState<BlurtType[]>([]);
  const [myVaults, setMyVaults] = useState<VaultType[]>([]);
  const [feedFlashes, setFeedFlashes] = useState<FlashType[]>([]);
  const [feedBlurts, setFeedBlurts] = useState<BlurtType[]>([]);
  const [counts, setCounts] = useState({ tenders: 0, tended: 0 });
  const [selectedFlash, setSelectedFlash] = useState<FlashType | null>(null);

  useEffect(() => {
    fetchMe()
      .then(async (me) => {
        setProfile(me);
        if (me) {
          const [flashes, blurts, vaults, tendingCounts] = await Promise.all([
            fetchSpaceFlashes(me.id),
            fetchSpaceBlurts(me.id),
            fetchMyVaults(),
            fetchTendingCounts(me.id),
          ]);
          setMyFlashes(flashes);
          setMyBlurts(blurts);
          setMyVaults(vaults);
          setCounts(tendingCounts);
        }
        const [fp, fw] = await Promise.all([fetchFlashFeed(), fetchBlurtFeed()]);
        setFeedFlashes(fp);
        setFeedBlurts(fw);
      })
      .finally(() => setLoading(false));
  }, []);

  function refreshMine() {
    if (!profile) return;
    fetchSpaceFlashes(profile.id).then(setMyFlashes);
    fetchSpaceBlurts(profile.id).then(setMyBlurts);
    fetchMyVaults().then(setMyVaults);
  }

  if (loading) return <LoadingScene />;

  const displayName = profile?.display_name || "Explorer";
  const username = profile?.username || "explorer";
  const avatar = profile?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=haven";

  const NAV_ICONS: Record<Tab, ReactElement> = {
    feed: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V20a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V9.5" />
      </svg>
    ),
    space: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    ),
    trail: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="2.2" />
        <circle cx="18" cy="12" r="2.2" />
        <circle cx="8" cy="19" r="2.2" />
        <path d="M7.6 7.6 15.8 11M16 14l-6 3.6" />
      </svg>
    ),
    den: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5Z" />
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3.2" />
        <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2.06 2.06 0 1 1-2.92 2.92l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V19.7a2.06 2.06 0 1 1-4.12 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2.06 2.06 0 1 1-2.92-2.92l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H4.3a2.06 2.06 0 1 1 0-4.12h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2.06 2.06 0 1 1 2.92-2.92l.06.06a1.7 1.7 0 0 0 1.87.34H10.5a1.7 1.7 0 0 0 1.03-1.56V4.3a2.06 2.06 0 1 1 4.12 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2.06 2.06 0 1 1 2.92 2.92l-.06.06a1.7 1.7 0 0 0-.34 1.87V10.5a1.7 1.7 0 0 0 1.56 1.03h.09a2.06 2.06 0 1 1 0 4.12h-.09a1.7 1.7 0 0 0-1.56 1.03Z" />
      </svg>
    ),
  };

  const navItem = (key: Tab, label: string) => (
    <button
      type="button"
      onClick={() => setTab(key)}
      className={`space-nav-item${tab === key ? " active" : ""}`}
    >
      <span className="nav-icon" aria-hidden="true">{NAV_ICONS[key]}</span>
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        width: "100vw",
        height: "100vh",
        background: "linear-gradient(180deg, #FFFFFF 0%, #FFF6F7 55%, #FFEFF1 100%)",
        fontFamily: "Zen Kaku Gothic New, sans-serif",
      }}
    >
      <Wake />

      {/* SIDEBAR */}
      <aside
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(10px)",
          borderRight: "1px solid var(--line)",
          padding: "30px 24px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="wordmark" style={{ fontSize: 28, color: "var(--cherry-deep)" }}>
            Haven<span className="dot" style={{ color: "var(--cherry-bright)" }}>・</span>
          </div>

          <button
            type="button"
            onClick={() => setTab("settings")}
            title="Edit your profile"
            className="space-card interactive"
            style={{
              borderColor: tab === "settings" ? "var(--cherry)" : undefined,
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "var(--blush-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--cherry)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </span>
            <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--cherry)", marginBottom: 12 }}>
              <img src={avatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "var(--ink)", fontFamily: "'Shippori Mincho', serif" }}>{displayName}</h3>
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink-muted)" }}>@{username}</p>
            {profile?.bio && <p style={{ margin: "0 0 10px", fontSize: 12, color: "var(--ink)" }}>{profile.bio}</p>}

            <div style={{ display: "flex", gap: 16, fontSize: 12, borderTop: "1px solid var(--line)", paddingTop: 10, width: "100%", justifyContent: "center" }}>
              <div>
                <strong style={{ display: "block", color: "var(--cherry)" }}>{counts.tenders}</strong>
                <span style={{ color: "var(--ink-muted)", fontSize: 10 }}>Tenders</span>
              </div>
              <div>
                <strong style={{ display: "block", color: "var(--cherry)" }}>{counts.tended}</strong>
                <span style={{ color: "var(--ink-muted)", fontSize: 10 }}>Tended</span>
              </div>
            </div>
          </button>

          <nav className="space-nav">
            {navItem("feed", "Feed")}
            {navItem("space", "My Space")}
            {navItem("trail", "Trail")}
            {navItem("den", "Den")}
            {navItem("settings", "Profile Settings")}
          </nav>
        </div>

        <button type="button" onClick={onLogout} className="btn btn-ghost" style={{ width: "100%" }}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h9" />
            <path d="M19 12H9m10 0-3.5-3.5M19 12l-3.5 3.5" />
          </svg>
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ padding: "40px 60px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
        {tab === "feed" && (
          <div className="haven-panel-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <h1 style={{ fontFamily: "Shippori Mincho, serif", fontSize: 32, margin: "0 0 6px", color: "var(--ink)" }}>
                Welcome back, {displayName}
              </h1>
              <p style={{ color: "var(--ink-muted)", fontSize: 14.5, margin: 0 }}>
                Here's what's new across Haven right now.
              </p>
            </div>

            <Composer
              onFlashCreated={(p) => { setMyFlashes((prev) => [p, ...prev]); setFeedFlashes((prev) => [p, ...prev]); }}
              onBlurtCreated={(w) => { setMyBlurts((prev) => [w, ...prev]); setFeedBlurts((prev) => [w, ...prev]); }}
              onVaultCreated={refreshMine}
            />

            <Feed
              flashes={feedFlashes}
              blurts={feedBlurts}
              currentUserId={profile?.id}
              onFlashFallen={(id) => setFeedFlashes((prev) => prev.filter((f) => f.id !== id))}
              onBlurtFallen={(id) => setFeedBlurts((prev) => prev.filter((w) => w.lingering || w.id !== id))}
            />
          </div>
        )}

        {tab === "space" && (
          <div className="haven-panel-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h1 style={{ fontFamily: "Shippori Mincho, serif", fontSize: 28, margin: "0 0 6px", color: "var(--ink)" }}>My Space</h1>
            <SpaceGrid flashes={myFlashes} blurts={myBlurts} onSelectFlash={setSelectedFlash} />
            {myVaults.length > 0 && (
              <div>
                <div className="vault-chamber-header">
                  <span className="vault-chamber-title">Sealed Vaults</span>
                  <span className="vault-chamber-line" aria-hidden="true" />
                </div>
                <div className="vault-chamber-grid">
                  {myVaults.map((b) => <VaultCard key={b.id} vault={b} onDeleted={refreshMine} />)}
                </div>
              </div>
            )}
            {selectedFlash && (
              <div style={{ maxWidth: 420, marginTop: 12 }}>
                <FlashCard flash={selectedFlash} />
              </div>
            )}
          </div>
        )}

        {tab === "trail" && profile && (
          <div className="haven-panel-in" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <h1 style={{ fontFamily: "Shippori Mincho, serif", fontSize: 28, margin: "0 0 6px", color: "var(--ink)" }}>Trail</h1>
            <Trail authorId={profile.id} />
          </div>
        )}

        {tab === "den" && profile && (
          <div className="haven-panel-in" style={{ display: "flex", flexDirection: "column", gap: 24, height: "100%" }}>
            <h1 style={{ fontFamily: "Shippori Mincho, serif", fontSize: 28, margin: "0 0 6px", color: "var(--ink)" }}>Den</h1>
            <Den myId={profile.id} />
          </div>
        )}

        {tab === "settings" && profile && (
          <div className="haven-panel-in">
            <ProfileSettings
              profile={{ ...profile, karma: counts.tenders }}
              onBack={() => setTab("feed")}
              onUpdated={(updated) =>
                setProfile((prev) => (prev ? ({ ...prev, ...updated } as Profile) : prev))
              }
            />
          </div>
        )}
      </main>
    </div>
  );
}