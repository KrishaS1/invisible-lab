import { glossaryEntry } from "../content/glossary";

export function Term({ id, children }: { id: string; children: string }) {
  const entry = glossaryEntry(id);
  if (!entry) return <>{children}</>;
  return (
    <abbr className="term" title={entry.short}>
      {children}
    </abbr>
  );
}
