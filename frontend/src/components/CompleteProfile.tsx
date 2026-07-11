import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
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

const TOPICS = [
  "Gaming", "Technology", "Art & Design", "Sports", "Music", "Movies & TV",
  "Science", "Books", "Food", "Fitness", "Travel", "Photography",
];

const BIO_LIMIT = 280;

export default function CompleteProfile({ active, play, initialUsername, onSuccess }: CompleteProfileProps) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState(initialUsername || "");
  const [bio, setBio] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  // Avatar: either an uploaded file (from the user's own device) or a preset URL.
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(PRESET_AVATARS[0].url);
  const [selectedPreset, setSelectedPreset] = useState(PRESET_AVATARS[0].url);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [usernameError, setUsernameError] = useState("");
  const [displayNameError, setDisplayNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const displayNameFilled = displayName.trim().length > 0;
  const usernameFilled = username.trim().length > 0;
  const inBloom = displayNameFilled && usernameFilled && !usernameError && !displayNameError;

  function pickFile(file: File | undefined | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image is too large — please pick something under 5MB.");
      return;
    }
    setError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function handleFileInput(e: ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0]);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0]);
  }

  function choosePreset(url: string) {
    setAvatarFile(null);
    setSelectedPreset(url);
    setAvatarPreview(url);
  }

  function removeUpload() {
    setAvatarFile(null);
    setAvatarPreview(selectedPreset);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleInterest(topic: string) {
    setInterests((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

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

    await saveProfile(username.trim(), displayName.trim());
  }

  async function handleSkip() {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const finalUser = username.trim() || `explorer_${randomNum}`;
    const finalDisplay = displayName.trim() || "New Explorer";
    await saveProfile(finalUser, finalDisplay, true);
  }

  async function saveProfile(userVal: string, displayVal: string, skipAvatar = false) {
    setError("");
    setSubmitting(true);
    try {
      await updateProfile({
        username: userVal,
        display_name: displayVal,
        avatar_url: skipAvatar || avatarFile ? "" : selectedPreset,
        avatar_file: skipAvatar ? null : avatarFile,
        bio: bio.trim() || "Just joined Haven!",
        interests: interests.join(", "),
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

        {/* LEFT — live preview card */}
        <div className="profile-brand-panel fx fx-1">
          <span className="step-badge" style={{ marginBottom: 22 }}>
            <span className="step-badge-dot">2</span>
            Almost there
          </span>

          <div className="preview-card">
            <div className="preview-card-cover" />
            <div className="preview-card-avatar">
              <img src={avatarPreview} alt="Avatar preview" onError={(e) => { (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url; }} />
            </div>
            <div className="preview-card-body">
              <h3>{displayName.trim() || "New Explorer"}</h3>
              <p className="preview-card-handle">@{username.trim() || "explorer_name"}</p>
              <p className="preview-card-bio">{bio.trim() || "Just joined Haven!"}</p>
              {interests.length > 0 && (
                <div className="preview-card-tags">
                  {interests.slice(0, 4).map((t) => (
                    <span key={t} className="preview-tag">{t}</span>
                  ))}
                  {interests.length > 4 && <span className="preview-tag">+{interests.length - 4}</span>}
                </div>
              )}
            </div>
          </div>

          <p style={{ marginTop: 22 }}>This is a live preview of your Haven profile card — it updates as you type.</p>
        </div>

        {/* RIGHT — form panel */}
        <div className="login-content">
          <div className="login-head fx fx-2" style={{ marginBottom: 16 }}>
            <h1>Complete<br />your profile.</h1>
            <p className="sub">Set up your identity before joining the community.</p>
          </div>

          <form onSubmit={handleSave}>
            <div className={`vine-field-list${inBloom ? " in-bloom" : ""}`}>

              {/* Avatar upload */}
              <div className="vine-field fx fx-3">
                <span className="vine-bud" aria-hidden="true" />
                <label>Profile picture <span style={{ fontWeight: 400, color: "var(--ink-muted)" }}>(optional)</span></label>

                <div
                  className={`avatar-dropzone${dragOver ? " drag-over" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="avatar-preview-ring">
                    <div className="avatar-preview-ring-inner">
                      <img src={avatarPreview} alt="Profile preview" onError={(e) => { (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url; }} />
                    </div>
                  </div>
                  <div className="avatar-dropzone-text">
                    <strong>{avatarFile ? avatarFile.name : "Click or drag a photo here"}</strong>
                    <span>PNG or JPG, up to 5MB — chosen straight from your device</span>
                  </div>
                  {avatarFile && (
                    <button type="button" className="avatar-remove-btn" onClick={(e) => { e.stopPropagation(); removeUpload(); }}>
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  style={{ display: "none" }}
                />

                <p className="link-btn" style={{ marginTop: 12, marginBottom: 8, cursor: "default", textDecoration: "none" }}>
                  Or pick a starter avatar
                </p>
                <div className="avatar-grid">
                  {PRESET_AVATARS.map((av) => {
                    const selected = !avatarFile && selectedPreset === av.url;
                    return (
                      <button
                        key={av.seed}
                        type="button"
                        className={`avatar-option${selected ? " selected" : ""}`}
                        onClick={() => choosePreset(av.url)}
                        title={av.name}
                      >
                        <img src={av.url} alt={av.name} />
                        {selected && <span className="avatar-option-check">✓</span>}
                      </button>
                    );
                  })}
                </div>
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

              {/* Bio */}
              <div className="vine-field fx fx-5">
                <span className="vine-bud" aria-hidden="true" />
                <label htmlFor="prof-bio">Bio <span style={{ fontWeight: 400, color: "var(--ink-muted)" }}>(optional)</span></label>
                <div className="input-wrap">
                  <textarea
                    id="prof-bio"
                    rows={2}
                    maxLength={BIO_LIMIT}
                    placeholder="Tell the community a little about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bio-textarea"
                  />
                </div>
                <span className="char-counter">{bio.length}/{BIO_LIMIT}</span>
              </div>

              {/* Interests */}
              <div className="vine-field fx fx-5">
                <span className="vine-bud" aria-hidden="true" />
                <label>Interests <span style={{ fontWeight: 400, color: "var(--ink-muted)" }}>(optional — helps us suggest communities)</span></label>
                <div className="topic-chip-grid">
                  {TOPICS.map((topic) => {
                    const selected = interests.includes(topic);
                    return (
                      <button
                        key={topic}
                        type="button"
                        className={`topic-chip${selected ? " selected" : ""}`}
                        onClick={() => toggleInterest(topic)}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
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

              <button type="button" className="ghost-btn fx fx-7" onClick={handleSkip} disabled={submitting}>
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}