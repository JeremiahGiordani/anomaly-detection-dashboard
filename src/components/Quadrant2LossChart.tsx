"use client";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "./Plot";
import { useSharedCursor } from "./SharedCursorContext";

interface LossPoint {
  t: number;
  avg_loss: number;
}

export default function Quadrant2LossChart() {
  const { currentTime, setCurrentTime, timeRange } = useSharedCursor();
  const [data, setData] = useState<LossPoint[]>([]);

  useEffect(() => {
    fetch("/api/losses")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    if (!data.length) return [];
    if (!timeRange) return data;
    return data.filter((d) => d.t >= timeRange.min && d.t <= timeRange.max);
  }, [data, timeRange]);

  const filteredToOriginal = useMemo(() => filtered.map((d) => d.t), [filtered]);

  if (data.length === 0) return <p className="text-gray-600">Loading loss chart…</p>;
  if (filtered.length === 0) return <p className="text-gray-600">No time in current window.</p>;

  const xs = filtered.map((d) => d.t);
  const ys = filtered.map((d) => d.avg_loss);

  const hoverHandler = (e: any) => {
    const idxFiltered = e?.points?.[0]?.pointIndex ?? null;
    if (idxFiltered == null) return;
    const orig = filteredToOriginal[idxFiltered];
    if (typeof orig === "number") setCurrentTime(orig);
  };

  const cursorInFiltered =
    currentTime != null ? filteredToOriginal.indexOf(currentTime) : -1;

  return (
    <div className="h-full min-h-0">
      <Plot
        data={[
          {
            type: "scatter",
            mode: "lines",
            x: xs,
            y: ys,
            line: { color: "steelblue", width: 2 },
            hovertemplate: "t=%{x}<br>loss=%{y:.3f}<extra></extra>",
          },
          ...(cursorInFiltered >= 0
            ? [
                {
                  type: "scatter",
                  mode: "markers",
                  x: [xs[cursorInFiltered]],
                  y: [ys[cursorInFiltered]],
                  marker: { size: 8, color: "red" },
                  name: "selected",
                } as any,
              ]
            : []),
        ]}
        layout={{
          margin: { l: 40, r: 10, b: 30, t: 10 },
          xaxis: { title: "Time (index)" },
          yaxis: { title: "Avg Reconstruction Loss" },
        }}
        style={{ width: "100%", height: "100%" }}
        onHover={hoverHandler}
        config={{ displayModeBar: false }}
      />
    </div>
  );
}
