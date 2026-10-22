// Top view, nose at the top. Left and right are the person's left and right,
// which is the neurology convention, so the person's left is on the right of the drawing.

const SITES: { id: string; x: number; y: number }[] = [
  { id: "Fp1", x: 128, y: 58 },
  { id: "Fp2", x: 72, y: 58 },
  { id: "C3", x: 158, y: 112 },
  { id: "Cz", x: 100, y: 112 },
  { id: "C4", x: 42, y: 112 },
  { id: "P3", x: 132, y: 148 },
  { id: "Pz", x: 100, y: 150 },
  { id: "P4", x: 68, y: 148 },
  { id: "O1", x: 126, y: 176 },
  { id: "O2", x: 74, y: 176 },
];

export function HeadMap({
  active,
  available,
  onPick,
}: {
  active: string;
  available: string[];
  onPick: (id: string) => void;
}) {
  return (
    <figure className="head-map">
      <figcaption>Top of the head, nose up. Left means the person's left.</figcaption>
      <svg viewBox="0 0 200 220" role="img" aria-label="Electrode positions">
        <circle cx="100" cy="116" r="78" fill="none" stroke="#8ea2b3" strokeWidth="1.5" />
        <path d="M88 40 L100 26 L112 40" fill="none" stroke="#8ea2b3" strokeWidth="1.5" />
        <path d="M22 116 q8 -16 0 -32" fill="none" stroke="#8ea2b3" strokeWidth="1.5" />
        <path d="M178 116 q-8 -16 0 -32" fill="none" stroke="#8ea2b3" strokeWidth="1.5" />
        {SITES.map((site) => {
          const enabled = available.includes(site.id);
          const on = site.id === active;
          return (
            <g key={site.id}>
              <circle cx={site.x} cy={site.y} r={on ? 9 : 7} fill={on ? "#2aa7b8" : enabled ? "#1c3344" : "#152230"} stroke={enabled ? "#2aa7b8" : "#3c5163"} />
              <text x={site.x} y={site.y + 18} textAnchor="middle" fill="#d5e2ec" fontSize="9">
                {site.id}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="choice-row">
        {available.map((id) => (
          <button key={id} type="button" className={id === active ? "btn selected" : "btn"} onClick={() => onPick(id)}>
            {id}
          </button>
        ))}
      </div>
    </figure>
  );
}
