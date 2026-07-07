import { fetchMe } from "../api/client";
import { useEffect, useState, type CSSProperties } from "react";
import LoadingScene from "./LoadingScene";
import ProfileSettings from "./ProfileSettings";

interface DashboardPlaceholderProps {
  onLogout: () => void;
}

interface UserProfile {
  username: string;
  display_name: string;
  avatar_url: string;
  karma: number;
  bio: string;
  email?: string;
  interests?: string;
  created_at?: string;
}

type Panel = "home" | "settings";

export default function DashboardPlaceholder({ onLogout }: DashboardPlaceholderProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>("home");

  useEffect(() => {
    fetchMe()
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  function handleLogOutClick() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    onLogout();
  }

  if (loading) {
    return <LoadingScene />;
  }

  const displayName = profile?.display_name || "Explorer";
  const username = profile?.username || "explorer";
  const avatar = profile?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=sakura";

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF6F7 55%, #FFEFF1 100%)',
      fontFamily: 'Zen Kaku Gothic New, sans-serif'
    }}>

      {/* SIDEBAR */}
      <aside style={{
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid var(--line)',
        padding: '30px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="wordmark" style={{ fontSize: '28px', color: 'var(--cherry-deep)' }}>
            Haven<span className="dot" style={{ color: 'var(--cherry-bright)' }}>・</span>
          </div>

          {/* User Profile Card */}
          <button
            onClick={() => setPanel("settings")}
            style={{
              background: '#fff',
              borderRadius: '18px',
              border: panel === 'settings' ? '1.5px solid var(--cherry)' : '1px solid var(--line)',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(196,24,60,0.04)',
              cursor: 'pointer',
              font: 'inherit'
            }}
          >
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid var(--cherry)',
              marginBottom: '12px'
            }}>
              <img src={avatar} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--ink)' }}>{displayName}</h3>
            <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--ink-muted)' }}>@{username}</p>

            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', borderTop: '1px solid var(--line)', paddingTop: '10px', width: '100%', justifyContent: 'center' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--cherry)' }}>{profile?.karma || 0}</strong>
                <span style={{ color: 'var(--ink-muted)', fontSize: '10px' }}>Karma</span>
              </div>
            </div>
          </button>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={() => setPanel("home")}
              style={navBtnStyle(panel === "home")}
            >
              🏠 Home
            </button>
            <button
              onClick={() => setPanel("settings")}
              style={navBtnStyle(panel === "settings")}
            >
              ⚙️ Settings
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogOutClick}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '999px',
            border: '1.5px solid var(--line)',
            background: 'transparent',
            color: 'var(--ink-muted)',
            fontFamily: 'Shippori Mincho, serif',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--cherry)'; e.currentTarget.style.color = 'var(--cherry)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink-muted)'; }}
        >
          Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{
        padding: '40px 60px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {panel === "settings" && profile ? (
          <ProfileSettings
            profile={profile}
            onUpdated={(updated) => { setProfile(updated); }}
          />
        ) : (
          <>
            <div>
              <h1 style={{ fontFamily: 'Shippori Mincho, serif', fontSize: '32px', margin: '0 0 6px', color: 'var(--ink)' }}>
                Welcome back, {displayName}!
              </h1>
              <p style={{ color: 'var(--ink-muted)', fontSize: '14.5px', margin: 0 }}>
                Here is what's blooming in your communities today.
              </p>
            </div>

            {/* FEED CARDS (static placeholder) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '640px', marginTop: '16px' }}>
              {[
                { community: "r/gardening", author: "sakura_lover", title: "My first cherry blossom tree is starting to bud! 🌸", body: "After three years of carefully pruning and tending to this young sapling, we are finally seeing the first tiny pink buds. Location: Zone 7b.", score: 48 },
                { community: "r/coding", author: "explorer_42", title: "Why building standard-focused communities is the future", body: "Centralized algorithms reward outrage and fast clicks. True community feeds should prioritize chronological depth, moderation, and user ownership.", score: 32 }
              ].map((post, idx) => (
                <div key={idx} style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: '20px',
                  padding: '24px',
                  boxShadow: '0 6px 20px rgba(122,15,38,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                    <span style={{ color: 'var(--cherry)', fontWeight: 700 }}>{post.community}</span>
                    <span style={{ color: 'var(--ink-muted)' }}>Posted by @{post.author}</span>
                  </div>

                  <h2 style={{ fontSize: '19px', fontWeight: 600, margin: 0, color: 'var(--ink)', lineHeight: '1.4' }}>{post.title}</h2>
                  <p style={{ fontSize: '14.5px', margin: 0, color: 'var(--ink)', opacity: 0.85, lineHeight: '1.6' }}>{post.body}</p>

                  <div style={{ display: 'flex', gap: '20px', fontSize: '13px', borderTop: '1px solid rgba(196,24,60,0.08)', paddingTop: '12px', color: 'var(--ink-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>▲</span>
                      <span style={{ color: 'var(--cherry-deep)', fontWeight: 700 }}>{post.score}</span>
                      <span>▼</span>
                    </div>
                    <span>💬 12 comments</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

    </div>
  );
}

function navBtnStyle(active: boolean): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'left',
    padding: '10px 14px',
    borderRadius: '12px',
    border: 'none',
    background: active ? 'var(--blush-soft)' : 'transparent',
    color: active ? 'var(--cherry-deep)' : 'var(--ink-muted)',
    fontFamily: 'Zen Kaku Gothic New, sans-serif',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  };
}
