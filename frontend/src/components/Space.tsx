import { useEffect, useState } from "react";
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
import BlurtCard from "./Blurt";
import VaultCard from "./Vault";

interface SpaceProps {
  onLogout: () => void;
}

type Tab = "feed" | "space" | "trail" | "den";

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

  const navItem = (key: Tab, label: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        textAlign: "left",
        border: "none",
        background: tab === key ? "rgba(196,24,60,0.08)" : "transparent",
        color: tab === key ? "var(--cherry-deep)" : "var(--ink-muted)",
        fontWeight: tab === key ? 700 : 500,
        fontSize: 14,
        padding: "10px 14px",
        borderRadius: 12,
        cursor: "pointer",
      }}
    >
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

          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              border: "1px solid var(--line)",
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              boxShadow: "0 4px 16px rgba(196,24,60,0.04)",
            }}
          >
            <div style={{ width: 60, height: 60, borderRadius: "50%", overflow: "hidden", border: "2px solid var(--cherry)", marginBottom: 12 }}>
              <img src={avatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "var(--ink)" }}>{displayName}</h3>
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
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {navItem("feed", "Everyone's Flashes & Blurts")}
            {navItem("space", "My Space")}
            {navItem("trail", "Trail")}
            {navItem("den", "Den")}
          </nav>
        </div>

        <button
          onClick={onLogout}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 999,
            border: "1.5px solid var(--line)",
            background: "transparent",
            color: "var(--ink-muted)",
            fontFamily: "Shippori Mincho, serif",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ padding: "40px 60px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24 }}>
        {tab === "feed" && (
          <>
            <div>
              <h1 style={{ fontFamily: "Shippori Mincho, serif", fontSize: 32, margin: "0 0 6px", color: "var(--ink)" }}>
                Welcome back, {displayName}!
              </h1>
              <p style={{ color: "var(--ink-muted)", fontSize: 14.5, margin: 0 }}>
                Here's what's blooming across Haven right now.
              </p>
            </div>

            <Composer
              onFlashCreated={(p) => setMyFlashes((prev) => [p, ...prev])}
              onBlurtCreated={(w) => { setMyBlurts((prev) => [w, ...prev]); setFeedBlurts((prev) => [w, ...prev]); }}
              onVaultCreated={refreshMine}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 640 }}>
              {feedBlurts.map((w) => <BlurtCard key={w.id} blurt={w} isOwn={w.author.id === profile?.id} />)}
              {feedFlashes.map((p) => <FlashCard key={p.id} flash={p} />)}
              {feedFlashes.length === 0 && feedBlurts.length === 0 && (
                <p style={{ color: "var(--ink-muted)", fontSize: 13.5 }}>Nothing's alive right now — be the first to plant something today.</p>
              )}
            </div>
          </>
        )}

        {tab === "space" && (
          <>
            <h1 style={{ fontFamily: "Shippori Mincho, serif", fontSize: 28, margin: "0 0 6px", color: "var(--ink)" }}>My Space</h1>
            <SpaceGrid flashes={myFlashes} blurts={myBlurts} onSelectFlash={setSelectedFlash} />
            {myVaults.length > 0 && (
              <div>
                <h3 style={{ fontSize: 14, color: "var(--ink-muted)", margin: "20px 0 10px" }}>Sealed Vaults</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                  {myVaults.map((b) => <VaultCard key={b.id} vault={b} onDeleted={refreshMine} />)}
                </div>
              </div>
            )}
            {selectedFlash && (
              <div style={{ maxWidth: 420, marginTop: 12 }}>
                <FlashCard flash={selectedFlash} />
              </div>
            )}
          </>
        )}

        {tab === "trail" && profile && (
          <>
            <h1 style={{ fontFamily: "Shippori Mincho, serif", fontSize: 28, margin: "0 0 6px", color: "var(--ink)" }}>Trail</h1>
            <Trail authorId={profile.id} />
          </>
        )}

        {tab === "den" && profile && (
          <>
            <h1 style={{ fontFamily: "Shippori Mincho, serif", fontSize: 28, margin: "0 0 6px", color: "var(--ink)" }}>Den</h1>
            <Den myId={profile.id} />
          </>
        )}
      </main>
    </div>
  );
}
