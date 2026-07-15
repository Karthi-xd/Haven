import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { updateProfile, getErrorMessage } from "../api/auth";
import { uploadAvatarImage } from "../api/storage";

interface UserProfile {
  id?: string;
  username: string;
  display_name: string;
  avatar_url: string;
  karma: number;
  bio: string;
  email?: string;
  created_at?: string;
}

interface ProfileSettingsProps {
  profile: UserProfile;
  onUpdated: (profile: UserProfile) => void;
  onBack?: () => void;
}

const BIO_LIMIT = 280;
const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
type Tab = "profile" | "photo" | "account";

export default function ProfileSettings({ profile, onUpdated, onBack }: ProfileSettingsProps) {
  const [tab, setTab] = useState<Tab>("profile");

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url || "");
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState<"link" | "id" | null>(null);

  const usernameValid = username.length === 0 || USERNAME_RE.test(username);

  const hasChanges = useMemo(() => {
    return (
      displayName.trim() !== (profile.display_name || "").trim() ||
      username.trim() !== (profile.username || "").trim() ||
      bio !== (profile.bio || "") ||
      !!avatarFile ||
      avatarRemoved
    );
  }, [displayName, username, bio, avatarFile, avatarRemoved, profile]);

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
    setAvatarRemoved(false);
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

  function undoNewUpload() {
    setAvatarFile(null);
    setAvatarPreview(avatarRemoved ? "" : profile.avatar_url || "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto() {
    setAvatarFile(null);
    setAvatarPreview("");
    setAvatarRemoved(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function resetChanges() {
    setDisplayName(profile.display_name || "");
    setUsername(profile.username || "");
    setBio(profile.bio || "");
    setAvatarFile(null);
    setAvatarRemoved(false);
    setAvatarPreview(profile.avatar_url || "");
    setError("");
    setSuccess("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function copyToClipboard(text: string, which: "link" | "id") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied((prev) => (prev === which ? null : prev)), 1600);
    } catch {
      setError("Couldn't copy — your browser blocked clipboard access.");
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername && !USERNAME_RE.test(cleanUsername)) {
      setError("Usernames need 3–20 characters: lowercase letters, numbers, or underscores only.");
      return;
    }
    if (!displayName.trim()) {
      setError("Display name can't be empty.");
      return;
    }

    setSaving(true);
    try {
      let avatar_url = profile.avatar_url;
      if (avatarFile) {
        avatar_url = await uploadAvatarImage(avatarFile);
      } else if (avatarRemoved) {
        avatar_url = "";
      }
      const updated = await updateProfile({
        username: cleanUsername,
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url,
      });
      setAvatarFile(null);
      setAvatarRemoved(false);
      setSuccess("Your profile has been updated.");
      onUpdated({ ...profile, ...updated });
    } catch (err: any) {
      setError(getErrorMessage(err, "Couldn't save your changes. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const bioPct = bio.length / BIO_LIMIT;
  const profileLink = `haven.app/@${(username || profile.username || "explorer").trim()}`;

  return (
    <div className="settings-shell">
      {onBack && (
        <button type="button" className="back-link settings-back" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Haven
        </button>
      )}
      <div className="settings-head">
        <span className="settings-eyebrow">Your Haven</span>
        <h1>Profile Settings</h1>
        <p>Manage how you appear across Haven.</p>
      </div>

      <div className="settings-tabs-row">
        <div className="settings-tabs">
          <button type="button" className={`settings-tab${tab === "profile" ? " active" : ""}`} onClick={() => setTab("profile")}>Profile</button>
          <button type="button" className={`settings-tab${tab === "photo" ? " active" : ""}`} onClick={() => setTab("photo")}>Photo</button>
          <button type="button" className={`settings-tab${tab === "account" ? " active" : ""}`} onClick={() => setTab("account")}>Account</button>
        </div>
        {hasChanges && tab !== "account" && <span className="unsaved-pill">Unsaved changes</span>}
      </div>

      <form onSubmit={handleSave} className="settings-panel">
        {tab === "profile" && (
          <div className="settings-split">
            <div className="settings-section">
              <div className="vine-field">
                <span className="vine-bud" aria-hidden="true" />
                <label htmlFor="set-display">Display name</label>
                <div className="input-wrap">
                  <input
                    id="set-display"
                    type="text"
                    maxLength={40}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <div className="input-underline" />
                </div>
              </div>

              <div className="vine-field">
                <span className="vine-bud" aria-hidden="true" />
                <label htmlFor="set-user">Username</label>
                <div className={`input-wrap username-input-wrap${!usernameValid ? " field-invalid" : ""}`}>
                  <span className="username-at-prefix">@</span>
                  <input
                    id="set-user"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  />
                  <div className="input-underline" />
                </div>
                <span className={`field-hint${!usernameValid ? " field-hint-error" : ""}`}>
                  {usernameValid ? "Lowercase letters, numbers, and underscores only." : "3–20 characters: lowercase letters, numbers, underscores."}
                </span>
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
                <span className={`char-counter${bioPct > 0.95 ? " char-counter-limit" : bioPct > 0.8 ? " char-counter-warn" : ""}`}>
                  {bio.length}/{BIO_LIMIT}
                </span>
              </div>
            </div>

            <div className="settings-preview" aria-hidden="true">
              <span className="settings-preview-label">Live preview</span>
              <div className="settings-preview-card">
                <span className="settings-preview-avatar">
                  {avatarPreview ? <img src={avatarPreview} alt="" /> : <span style={{ fontSize: 22 }}>🌸</span>}
                </span>
                <strong className="settings-preview-name">{displayName.trim() || "Your name"}</strong>
                <span className="settings-preview-username">@{username.trim() || "username"}</span>
                {bio.trim() && <p className="settings-preview-bio">{bio.trim()}</p>}
              </div>
              <span className="settings-preview-note">This is how your Space card looks to others.</span>
            </div>
          </div>
        )}

        {tab === "photo" && (
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
                  <strong>{avatarFile ? avatarFile.name : avatarRemoved ? "Photo will be removed" : "Click or drag a new photo here"}</strong>
                  <span>PNG or JPG, up to 5MB — chosen straight from your device</span>
                </div>
                {avatarFile && (
                  <button type="button" className="avatar-remove-btn" onClick={(e) => { e.stopPropagation(); undoNewUpload(); }}>
                    Undo
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} style={{ display: "none" }} />

              {!avatarFile && profile.avatar_url && !avatarRemoved && (
                <button type="button" className="text-danger-btn" onClick={removePhoto}>
                  Remove current photo
                </button>
              )}
              {avatarRemoved && (
                <button type="button" className="text-danger-btn" onClick={undoNewUpload}>
                  Keep current photo
                </button>
              )}
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
            <div className="account-row">
              <span className="account-row-label">Profile link</span>
              <span className="account-row-value copy-row">
                {profileLink}
                <button type="button" className="copy-btn" onClick={() => copyToClipboard(`https://${profileLink}`, "link")}>
                  {copied === "link" ? "Copied" : "Copy"}
                </button>
              </span>
            </div>
            {profile.id && (
              <div className="account-row">
                <span className="account-row-label">User ID</span>
                <span className="account-row-value copy-row">
                  <span className="mono-id">{profile.id.slice(0, 8)}…</span>
                  <button type="button" className="copy-btn" onClick={() => copyToClipboard(profile.id!, "id")}>
                    {copied === "id" ? "Copied" : "Copy"}
                  </button>
                </span>
              </div>
            )}
            <p className="settings-hint">Password and connected-account management aren't available yet — coming soon.</p>
          </div>
        )}

        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}

        {tab !== "account" && (
          <div className="settings-actions">
            {hasChanges && (
              <button type="button" className="btn btn-ghost" onClick={resetChanges} disabled={saving}>
                Discard
              </button>
            )}
            <button type="submit" className="login-submit" disabled={saving || !hasChanges || !usernameValid}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}