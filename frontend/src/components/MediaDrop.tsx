import { useRef, useState, type DragEvent } from "react";

interface MediaDropProps {
  file: File | null;
  onFile: (file: File | null) => void;
  accent: "flash" | "vault";
  label?: string;
}

/** A single dashed-aperture dropzone: drag a photo/video in, or click to browse. */
export default function MediaDrop({ file, onFile, accent, label }: MediaDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const previewUrl = file ? URL.createObjectURL(file) : null;
  const isVideo = file?.type.startsWith("video");

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (f) onFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div
      className={`media-drop is-${accent}${dragging ? " is-dragging" : ""}${file ? " has-file" : ""}`}
      onClick={() => !file && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {!file && (
        <div className="media-drop-empty">
          <span className="media-drop-aperture" aria-hidden="true">
            <svg viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="1.4" strokeDasharray="4 5" />
              <path d="M24 15v18M15 24h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </span>
          <p className="media-drop-label">{label || "Drop a photo or video, or click to choose"}</p>
        </div>
      )}

      {file && previewUrl && (
        <div className="media-drop-preview">
          {isVideo ? (
            <video src={previewUrl} muted playsInline />
          ) : (
            <img src={previewUrl} alt="Selected media" />
          )}
          <button
            type="button"
            className="media-drop-clear"
            onClick={(e) => {
              e.stopPropagation();
              onFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            aria-label="Remove media"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}