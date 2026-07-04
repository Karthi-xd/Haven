import { useState, type FormEvent } from "react";
import { updateProfile, getErrorMessage } from "../api/client";

interface CompleteProfileProps {
  active: boolean;
  play: boolean;
  initialUsername: string;
  onSuccess: () => void;
}

const PRESET_AVATARS = [
  { name: "Sakura", seed: "sakura", url: "https://api.dicebear.com/7.x/bottts/svg?seed=sakura" },
  { name: "Cat", seed: "kitty", url: "https://api.dicebear.com/7.x/bottts/svg?seed=kitty" },
  { name: "Explorer", seed: "explorer", url: "https://api.dicebear.com/7.x/bottts/svg?seed=explorer" },
  { name: "Wave", seed: "wave", url: "https://api.dicebear.com/7.x/bottts/svg?seed=wave" },
];

export default function CompleteProfile({ active, play, initialUsername, onSuccess }: CompleteProfileProps) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState(initialUsername || "");
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState("");
  const [useCustomUrl, setUseCustomUrl] = useState(false);

  const [usernameError, setUsernameError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const finalAvatar = useCustomUrl ? customAvatarUrl : selectedAvatar;

  const displayNameFilled = displayName.trim().length > 0;
  const usernameFilled = username.trim().length > 0;
  const inBloom = displayNameFilled && usernameFilled && !usernameError && !displayNameError;

  function validateUsername() {
    const val = username.trim();
    if (val.length === 0) {
      setUsernameError("Username is required.");
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(val)) {
      setUsernameError("Username must be 3-20 characters (alphanumeric and underscores).");
    } else {
      setUsernameError("");
    }
  }

  function validateDisplayName() {
    if (displayName.trim().length === 0) {
      setDisplayNameError("Display name is required.");
    } else {
      setDisplayNameError("");
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    validateUsername();
    validateDisplayName();

    if (!username.trim() || !displayName.trim() || usernameError || displayNameError) {
      return;
    }

    await saveProfile(username.trim(), displayName.trim(), finalAvatar);
  }

  async function handleSkipAvatar() {
    // Generate defaults for name/username if empty
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const finalUser = username.trim() || `explorer_${randomNum}`;
    const finalDisplay = displayName.trim() || "New Explorer";

    // Skip the profile picture — send empty string so backend keeps default
    await saveProfile(finalUser, finalDisplay, "");
  }

  async function saveProfile(userVal: string, displayVal: string, avatarVal: string) {
    setError("");
    setSubmitting(true);
    try {
      await updateProfile({
        username: userVal,
        display_name: displayVal,
        avatar_url: avatarVal,
        bio: "Just joined Haven!",
      });
      onSuccess();
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to update profile. Please try a different username."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={`view view-login${active ? " active" : ""}${play ? " play" : ""}`}>
      <div className="login-scene" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div
          className="login-content"
          style={{
            maxWidth: "480px",
            borderRadius: "28px",
            border: "1px solid var(--line)",
            background: "rgba(255, 255, 255, 0.85)",
          }}
        >
          <div className="login-head fx fx-1" style={{ marginBottom: "24px" }}>
            <svg
              className="accent-branch"
              viewBox="0 0 120 90"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              style={{ width: "80px", top: "-20px" }}
            >
              <path className="ab-stem" d="M4 4 C 30 8, 52 20, 70 38 C 84 52, 92 62, 112 66" />
              <circle className="ab-bloom bright" cx="70" cy="38" r="7" />
              <circle className="ab-bloom light" cx="86" cy="30" r="5" />
            </svg>
            <h1>Complete profile.</h1>
            <p className="sub">Set up your identity before joining the community.</p>
          </div>

          <form onSubmit={handleSave}>
            <div className={`vine-field-list${inBloom ? " in-bloom" : ""}`} style={{ paddingLeft: "24px" }}>
              {/* Profile Picture — optional */}
              <div className="vine-field fx fx-2" style={{ gap: "12px", marginBottom: "8px" }}>
                <span className="vine-bud" aria-hidden="true" />
                <label>Profile Picture (optional)</label>

                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginTop: "4px" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "#fff",
                      border: "2.5px solid var(--cherry)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(196,24,60,0.12)",
                    }}
                  >
                    {finalAvatar ? (
                      <img
                        src={finalAvatar}
                        alt="Profile Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "28px" }}>🧭</span>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {PRESET_AVATARS.map((av) => (
                        <button
                          key={av.seed}
                          type="button"
                          onClick={() => {
                            setSelectedAvatar(av.url);
                            setUseCustomUrl(false);
                          }}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#fff",
                            border:
                              selectedAvatar === av.url && !useCustomUrl
                                ? "2px solid var(--cherry)"
                                : "1px solid var(--line)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            padding: 0,
                            boxShadow:
                              selectedAvatar === av.url && !useCustomUrl
                                ? "0 0 0 3px rgba(196,24,60,0.1)"
                                : "none",
                          }}
                          title={av.name}
                        >
                          <img src={av.url} alt={av.name} style={{ width: "80%", height: "80%" }} />
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setUseCustomUrl(!useCustomUrl)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--cherry-deep)",
                        fontSize: "12px",
                        fontWeight: 700,
                        textAlign: "left",
                        cursor: "pointer",
                        padding: 0,
                        textDecoration: "underline",
                      }}
                    >
                      {useCustomUrl ? "Use preset avatar" : "Or use custom image URL..."}
                    </button>
                  </div>
                </div>

                {useCustomUrl && (
                  <div className="input-wrap fx fx-2" style={{ marginTop: "4px" }}>
                    <input
                      type="url"
                      placeholder="https://example.com/your-image.jpg"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      style={{ padding: "6px 2px 8px", fontSize: "14px" }}
                    />
                    <div className="input-underline" />
                  </div>
                )}
              </div>

              {/* Display Name — required */}
              <div
                className={`vine-field fx fx-3${displayNameFilled ? " filled" : ""}${displayNameError ? " field-error" : ""}`}
              >
                <span className="vine-bud" aria-hidden="true" />
                <label htmlFor="prof-display">Display Name *</label>
                <div className="input-wrap">
                  <input
                    id="prof-display"
                    type="text"
                    placeholder="New Explorer"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      if (displayNameError) setDisplayNameError("");
                    }}
                    onBlur={validateDisplayName}
                  />
                  <div className="input-underline" />
                </div>
                {displayNameError && <p className="field-error-msg">{displayNameError}</p>}
              </div>

              {/* Username — required */}
              <div
                className={`vine-field fx fx-4${usernameFilled ? " filled" : ""}${usernameError ? " field-error" : ""}`}
              >
                <span className="vine-bud" aria-hidden="true" />
                <label htmlFor="prof-user">Username *</label>
                <div className="input-wrap">
                  <input
                    id="prof-user"
                    type="text"
                    placeholder="explorer_name"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (usernameError) setUsernameError("");
                    }}
                    onBlur={validateUsername}
                  />
                  <div className="input-underline" />
                </div>
                {usernameError && <p className="field-error-msg">{usernameError}</p>}
              </div>
            </div>

            {error && <p className="form-error fx fx-5">{error}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
              <button
                type="submit"
                className="login-submit fx fx-5"
                disabled={submitting}
                style={{ padding: "14px" }}
              >
                {submitting ? "Saving…" : "Continue"}
              </button>

              <button
                type="button"
                className="ghost-btn fx fx-6"
                onClick={handleSkipAvatar}
                disabled={submitting}
                style={{ borderRadius: "999px", padding: "12px" }}
              >
                Skip for now (profile picture only)
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}