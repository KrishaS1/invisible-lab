import { BANDS, type BandName } from "../signal/bands";
import { formatPower } from "../signal/format";

export function BandList({
  absolute,
  relative,
  highlight,
}: {
  absolute: Record<BandName, number>;
  relative: Record<BandName, number>;
  highlight?: BandName;
}) {
  return (
    <div className="band-list">
      {BANDS.map((band) => {
        const share = Math.max(0, Math.min(1, relative[band.id] ?? 0));
        return (
          <div key={band.id} className={highlight === band.id ? "band-row is-on" : "band-row"}>
            <span className="band-name">{band.label}</span>
            <span className="band-hz">
              {band.low}–{band.high} Hz
            </span>
            <div className="band-track" aria-hidden="true">
              <div className={`band-fill fill-${band.id}`} style={{ width: `${share * 100}%` }} />
            </div>
            <span className="band-value">{formatPower(absolute[band.id] ?? 0)} µV²</span>
          </div>
        );
      })}
      <p className="quiet">Bar length is relative power, that band's share of these five. The number is absolute power.</p>
    </div>
  );
}
