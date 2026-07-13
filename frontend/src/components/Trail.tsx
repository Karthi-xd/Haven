interface TrailProps {
  authorId: string;
}

export default function Trail(_props: TrailProps) {
  return (
    <div style={{ color: "var(--ink-muted)", fontSize: 14.5 }}>
      <p>No trail entries yet.</p>
    </div>
  );
}
