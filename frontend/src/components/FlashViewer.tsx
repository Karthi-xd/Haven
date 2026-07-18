import { useLifespan } from "../hooks/useLifespan";
import type { Flash } from "../types";

interface FlashViewerProps {
  flash: Flash;
  busy: boolean;
  onClose: () => void;
  onLinger: (id: string) => void;
  onDelete: (id: string) => void;
}

const RING_R = 21;
const RING_C = 2 * Math.PI * RING_R;

export default function FlashViewer({ flash, busy, onClose, onLinger, onDelete }: FlashViewerProps) {
  const life = useLifespan(flash.posted_at, flash.expires_at, flash.fallen);
  const isVideo = flash.media_kind === "video";

  return (
    <div className="flash-viewer" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flash-viewer-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="flash-viewer-close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="flash-viewer-media">
          {isVideo ? (
            <video src={flash.media_url} controls autoPlay playsInline />
          ) : (
            <img src={flash.media_url} alt={flash.caption || "Flash"} />
          )}

          <svg className="flash-viewer-ring" viewBox="0 0 48 48" aria-hidden="true">
            <circle className="ring-track" cx="24" cy="24" r={RING_R} />
            {!flash.lingering && (
              <circle
                className="ring-fill"
                cx="24"
                cy="24"
                r={RING_R}
                strokeDasharray={RING_C}
                strokeDashoffset={RING_C * life.lifeFraction}
              />
            )}
          </svg>
        </div>

        <div className="flash-viewer-footer">
          <div className="flash-viewer-meta">
            {flash.caption && <p className="flash-viewer-caption">{flash.caption}</p>}
            <span className={`trail-badge${flash.lingering ? " is-lingering" : flash.fallen ? " is-fallen" : " is-counting"}`}>
              {flash.lingering ? "🌿 Lingering" : flash.fallen ? "🥀 Fallen" : `⚡ ${life.label}`}
            </span>
          </div>
          {!flash.fallen && (
            <div className="flash-viewer-actions">
              {!flash.lingering && (
                <button type="button" className="btn is-quiet is-sm" disabled={busy} onClick={() => onLinger(flash.id)}>
                  Let it linger
                </button>
              )}
              <button type="button" className="btn is-quiet is-sm" disabled={busy} onClick={() => onDelete(flash.id)}>
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}