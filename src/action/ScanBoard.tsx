import type { KeyboardEvent } from "react";

export function ScanBoard({
  labels,
  index,
  lastChoice,
  onSelect,
  selectEnabled,
}: {
  labels: readonly string[];
  index: number;
  lastChoice: string | null;
  onSelect: () => void;
  selectEnabled: boolean;
}) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!selectEnabled) return;
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    onSelect();
  }

  return (
    <div
      className="scan-board"
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label="Scanning choices. Space or Enter selects the highlighted option."
    >
      <div className="scan-grid">
        {labels.map((label, itemIndex) => {
          const lit = itemIndex === index;
          const chosen = label === lastChoice;
          const className = ["btn", "scan-option", lit ? "lit" : "", chosen ? "chosen" : ""].filter(Boolean).join(" ");
          return (
            <button
              key={label}
              type="button"
              className={className}
              aria-current={lit ? "true" : undefined}
              onClick={() => {
                if (lit && selectEnabled) onSelect();
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button type="button" className="btn primary" onClick={onSelect} disabled={!selectEnabled}>
        Select highlighted
      </button>
    </div>
  );
}
