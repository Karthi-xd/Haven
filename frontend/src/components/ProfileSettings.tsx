import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { updateProfile, getErrorMessage } from "../api/client";

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

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdated: (profile: UserProfile) => void;
}

const TOPICS = [
  "Gaming", "Technology", "Art & Design", "Sports", "Music", "Movies & TV",
  "Science", "Books", "Food", "Fitness", "Travel", "Photography",
];

const BIO_LIMIT = 280;
type Tab = "profile" | "avatar" | "account";

export default function ProfileSettings({ profile, onUpdated }: ProfileSettingsProps) {
  const [tab, setTab] = useState<Tab>("profile");

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [interests, setInterests] = useState<string[]>(
    profile.interests ? profile.interests.split(",").map((s) => s.trim()).filter(Boolean) : []
  );

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || "");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  function removeUpload() {
    setAvatarFile(null);
    setAvatarPreview(profile.avatar_url || "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleInterest(topic: string) {
    setInterests((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const updated = await updateProfile({
        username: username.trim(),
        display_name: displayName.trim(),
        bio: bio.trim(),
        interests: interests.join(", "),
        avatar_file: avatarFile,
      });
      setAvatarFile(null);
      setSuccess("Your profile has been updated.");
      onUpdated(updated);
    } catch (err: any) {
      setError(getErrorMessage(err, "Couldn't save your changes. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  return (
    <div className="settings-shell">
      <div className="settings-head">
        <h1>Settings</h1>
        <p>Manage how you appear across Haven.</p>
      </div>

      <div className="settings-tabs">
        <button type="button" className={`settings-tab${tab === "profile" ? " active" : ""}`} onClick={() => setTab("profile")}>Profile</button>
        <button type="button" className={`settings-tab${tab === "avatar" ? " active" : ""}`} onClick={() => setTab("avatar")}>Avatar & Interests</button>
        <button type="button" className={`settings-tab${tab === "account" ? " active" : ""}`} onClick={() => setTab("account")}>Account</button>
      </div>

      <form onSubmit={handleSave} className="settings-panel">
        {tab === "profile" && (
          <div className="settings-section">
            <div className="vine-field">
              <span className="vine-bud" aria-hidden="true" />
              <label htmlFor="set-display">Display name</label>
              <div className="input-wrap">
                <input id="set-display" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                <div className="input-underline" />
              </div>
            </div>

            <div className="vine-field">
              <span className="vine-bud" aria-hidden="true" />
              <label htmlFor="set-user">Username</label>
              <div className="input-wrap username-input-wrap">
                <span className="username-at-prefix">@</span>
                <input id="set-user" type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} />
                <div className="input-underline" />
              </div>
            </div>

            <div className="vine-field">
              <span className="vine-bud" aria-hidden="true" />
              <label htmlFor="set-bio">Bio</label>
              <div className="input-wrap">
                <textarea
                  id="set-bio"
                  rows={3}
                  maxLength={BIO_LIMIT}
                  className="bio-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell the community a little about yourself..."
                />
              </div>
              <span className="char-counter">{bio.length}/{BIO_LIMIT}</span>
            </div>
          </div>
        )}

        {tab === "avatar" && (
          <div className="settings-section">
            <div className="vine-field">
              <span className="vine-bud" aria-hidden="true" />
              <label>Profile picture</label>
              <div
                className={`avatar-dropzone${dragOver ? " drag-over" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="avatar-preview-ring">
                  <div className="avatar-preview-ring-inner">
                    {avatarPreview ? <img src={avatarPreview} alt="Avatar preview" /> : <span style={{ fontSize: 26 }}>🌸</span>}
                  </div>
                </div>
                <div className="avatar-dropzone-text">
                  <strong>{avatarFile ? avatarFile.name : "Click or drag a new photo here"}</strong>
                  <span>PNG or JPG, up to 5MB — chosen straight from your device</span>
                </div>
                {avatarFile && (
                  <button type="button" className="avatar-remove-btn" onClick={(e) => { e.stopPropagation(); removeUpload(); }}>
                    Undo
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} style={{ display: "none" }} />
            </div>

            <div className="profile-divider" />

            <div className="vine-field">
              <span className="vine-bud" aria-hidden="true" />
              <label>Interests</label>
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
        )}

        {tab === "account" && (
          <div className="settings-section">
            <div className="account-row">
              <span className="account-row-label">Email</span>
              <span className="account-row-value">{profile.email || "—"}</span>
            </div>
            <div className="account-row">
              <span className="account-row-label">Member since</span>
              <span className="account-row-value">{joined}</span>
            </div>
            <div className="account-row">
              <span className="account-row-label">Karma</span>
              <span className="account-row-value">{profile.karma}</span>
            </div>
            <p className="settings-hint">Password and connected-account management aren't available yet — coming soon.</p>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        {tab !== "account" && (
          <button type="submit" className="login-submit" disabled={saving} style={{ marginTop: 8 }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        )}
      </form>
    </div>
  );
}
