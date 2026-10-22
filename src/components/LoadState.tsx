export function LoadState({ error, name }: { error: string | null; name: string }) {
  if (error) return <p className="result-note">{error}</p>;
  return <p className="quiet">Loading {name}…</p>;
}
