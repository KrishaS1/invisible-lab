import { Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { displaySeries, type ChartPoint } from "./series";

export function Waveform({
  samples,
  sfreq,
  cursorS,
  windowS,
  unit,
  color,
  label,
  peaks = [],
  yDomain,
}: {
  samples: ArrayLike<number>;
  sfreq: number;
  cursorS: number;
  windowS: number;
  unit: string;
  color: string;
  label: string;
  peaks?: number[];
  yDomain?: [number, number];
}) {
  const start = Math.floor(cursorS * sfreq);
  const count = Math.floor(windowS * sfreq);
  const points = displaySeries(samples, sfreq, start, count);
  const startT = start / sfreq;
  const endT = (start + count) / sfreq;
  const visiblePeaks = peaks
    .map((index) => index / sfreq)
    .filter((time) => time >= startT && time <= endT);

  return (
    <figure className="chart-frame">
      <figcaption>
        {label}
        <span>
          {windowS} s window · {unit}
        </span>
      </figcaption>
      <div className="chart-plot">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <XAxis
              dataKey="t"
              type="number"
              domain={[startT, endT]}
              tickFormatter={(value: number) => value.toFixed(1)}
              stroke="#8ea2b3"
              tick={{ fill: "#8ea2b3", fontSize: 12 }}
            />
            <YAxis
              domain={yDomain ?? ["auto", "auto"]}
              width={56}
              stroke="#8ea2b3"
              tick={{ fill: "#8ea2b3", fontSize: 12 }}
              tickFormatter={(value: number) => Math.abs(Number(value)) < 1 && Number(value) !== 0 ? Number(value).toFixed(2) : Number(value).toFixed(0)}
            />
            <Tooltip
              formatter={(value) => [Number(value).toFixed(2) + " " + unit, label]}
              labelFormatter={(value) => `${Number(value).toFixed(3)} s`}
            />
            {visiblePeaks.map((time) => (
              <ReferenceLine key={time} x={time} stroke="#c47d6a" strokeDasharray="3 3" />
            ))}
            <Line type="linear" dataKey="v" stroke={color} dot={false} isAnimationActive={false} strokeWidth={1.4} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export function PowerTimeline({
  times,
  series,
  colors,
  unit,
}: {
  times: number[];
  series: { name: string; values: number[] }[];
  colors: string[];
  unit: string;
}) {
  const points: Record<string, number>[] = times.map((time, index) => {
    const row: Record<string, number> = { t: time };
    for (const item of series) row[item.name] = item.values[index] ?? 0;
    return row;
  });
  return (
    <figure className="chart-frame">
      <figcaption>
        Power over time
        <span>each point is a 4 s window · {unit}</span>
      </figcaption>
      <div className="chart-plot">
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <XAxis dataKey="t" type="number" stroke="#8ea2b3" tick={{ fill: "#8ea2b3", fontSize: 12 }} tickFormatter={(value: number) => value.toFixed(0)} />
            <YAxis width={56} stroke="#8ea2b3" tick={{ fill: "#8ea2b3", fontSize: 12 }} />
            <Tooltip />
            {series.map((item, index) => (
              <Line key={item.name} type="linear" dataKey={item.name} stroke={colors[index]} dot={false} isAnimationActive={false} strokeWidth={1.6} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

export type { ChartPoint };
