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
  { name: "Moss", seed: "moss", url: "https://api.dicebear.com/7.x/bottts/svg?seed=moss" },
  { name: "Ember", seed: "ember", url: "https://api.dicebear.com/7.x/bottts/svg?seed=ember" },
  { name: "Drift", seed: "drift", url: "https://api.dicebear.com/7.x/bottts/svg?seed=drift" },
  { name: "Grove", seed: "grove", url: "https://api.dicebear.com/7.x/bottts/svg?seed=grove" },
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
      setUsernameError("3-20 characters — letters, numbers, underscores only.");
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
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const finalUser = username.trim() || `explorer_${randomNum}`;
    const finalDisplay = displayName.trim() || "New Explorer";
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
      <div className="login-scene">

        {/* LEFT — brand / art panel */}
        <div className="profile-brand-panel fx fx-1">
          <svg className="profile-blossom-art" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle className="pb-ring" cx="100" cy="100" r="88" />
            <circle className="pb-ring" cx="100" cy="100" r="70" />
            <g transform="translate(100 100)">
              {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                <ellipse
                  key={deg}
                  className={`pb-petal${i % 3 === 1 ? " light" : i % 3 === 2 ? " deep" : ""}`}
                  cx="0"
                  cy="-34"
                  rx="16"
                  ry="24"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle className="pb-center" r="10" />
            </g>
          </svg>
          <h2>Welcome to the grove.</h2>
          <p>Pick a face and a name for your Haven presence — you can always change it later from settings.</p>
        </div>

        {/* RIGHT — form panel */}
        <div className="login-content">
          <div className="login-head fx fx-2" style={{ marginBottom: "20px" }}>
            <span className="step-badge">
              <span className="step-badge-dot">2</span>
              Almost there
            </span>
            <h1>Complete<br />your profile.</h1>
            <p className="sub">Set up your identity before joining the community.</p>
          </div>

          <form onSubmit={handleSave}>
            <div className={`vine-field-list${inBloom ? " in-bloom" : ""}`}>

              {/* Avatar picker */}
              <div className="vine-field fx fx-3">
                <span className="vine-bud" aria-hidden="true" />
                <label>Profile picture <span style={{ fontWeight: 400, color: "var(--ink-muted)" }}>(optional)</span></label>

                <div className="avatar-picker-row" style={{ marginTop: "10px", marginBottom: "12px" }}>
                  <div className="avatar-preview-ring">
                    <div className="avatar-preview-ring-inner">
                      {finalAvatar ? (
                        <img
                          src={finalAvatar}
                          alt="Profile preview"
                          onError={(e) => { (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url; }}
                        />
                      ) : (
                        <span style={{ fontSize: "30px" }}>🌸</span>
                      )}
                    </div>
                  </div>

                  <div className="avatar-grid">
                    {PRESET_AVATARS.map((av) => {
                      const selected = selectedAvatar === av.url && !useCustomUrl;
                      return (
                        <button
                          key={av.seed}
                          type="button"
                          className={`avatar-option${selected ? " selected" : ""}`}
                          onClick={() => { setSelectedAvatar(av.url); setUseCustomUrl(false); }}
                          title={av.name}
                        >
                          <img src={av.url} alt={av.name} />
                          {selected && <span className="avatar-option-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="button" className="link-btn" onClick={() => setUseCustomUrl(!useCustomUrl)}>
                  {useCustomUrl ? "Use a preset avatar instead" : "Or paste a custom image URL..."}
                </button>

                {useCustomUrl && (
                  <div className="input-wrap fx fx-3" style={{ marginTop: "10px" }}>
                    <input
                      type="url"
                      placeholder="https://example.com/your-image.jpg"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    />
                    <div className="input-underline" />
                  </div>
                )}
              </div>

              <div className="profile-divider fx fx-3" />

              {/* Display Name */}
              <div className={`vine-field fx fx-4${displayNameFilled ? " filled" : ""}${displayNameError ? " field-error" : ""}`}>
                <span className="vine-bud" aria-hidden="true" />
                <label htmlFor="prof-display">Display name *</label>
                <div className="input-wrap">
                  <input
                    id="prof-display"
                    type="text"
                    placeholder="New Explorer"
                    value={displayName}
                    onChange={(e) => { setDisplayName(e.target.value); if (displayNameError) setDisplayNameError(""); }}
                    onBlur={validateDisplayName}
                  />
                  <div className="input-underline" />
                </div>
                {displayNameError && <p className="field-error-msg">{displayNameError}</p>}
              </div>

              {/* Username */}
              <div className={`vine-field fx fx-5${usernameFilled ? " filled" : ""}${usernameError ? " field-error" : ""}`}>
                <span className="vine-bud" aria-hidden="true" />
                <label htmlFor="prof-user">Username *</label>
                <div className="input-wrap username-input-wrap">
                  <span className="username-at-prefix">@</span>
                  <input
                    id="prof-user"
                    type="text"
                    placeholder="explorer_name"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value.replace(/\s/g, "")); if (usernameError) setUsernameError(""); }}
                    onBlur={validateUsername}
                  />
                  <div className="input-underline" />
                </div>
                {usernameError && <p className="field-error-msg">{usernameError}</p>}
              </div>
            </div>

            {error && <p className="form-error fx fx-6">{error}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "22px" }}>
              <button type="submit" className="login-submit fx fx-6" disabled={submitting}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2c-1.8 0-2 1.6-2.6 2.3C6.5 6.7 4 9.6 4 13c0 3.6 2.8 6.6 6.4 7.8.5.2 1.1.2 1.6 0C15.6 19.6 18.4 16.6 18.4 13c0-3.4-2.5-6.3-5.4-8.7C12.4 3.6 12.2 2 12 2z" />
                </svg>
                {submitting ? "Saving…" : "Enter Haven"}
              </button>

              <button type="button" className="ghost-btn fx fx-7" onClick={handleSkipAvatar} disabled={submitting}>
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
