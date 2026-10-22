export function Badge({ origin, text }: { origin: "physionet" | "upload" | "live" | "sketch"; text: string }) {
  return <p className={`badge badge-${origin}`}>{text}</p>;
}
