// src/components/Quadrant4TopFeatures.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "./Plot";
import { useSharedCursor } from "./SharedCursorContext";

export default function Quadrant4TopFeatures() {
  const { currentTime, timeRange } = useSharedCursor();
  const [features, setFeatures] = useState<string[]>([]);
  const [time, setTime] = useState<number[]>([]);
  const [losses, setLosses] = useState<number[][]>([]);
  const [topN, setTopN] = useState<number>(10);

  useEffect(() => {
    fetch("/api/feature-loss-matrix")
      .then((r) => r.json())
      .then((payload) => {
        setFeatures(payload.features);
        setTime(payload.time);
        setLosses(payload.losses);
      })
      .catch(console.error);
  }, []);

  // Determine selection mode:
  // - If a time is selected, use that single index.
  // - Otherwise, use the average over the visible time range (or all time if no filter).
  const selection = useMemo(() => {
    if (time.length === 0) return null;

    const fullRange = { min: 0, max: time.length - 1 };
    const visible = timeRange ?? fullRange;

    // If a currentTime exists, clamp it to the visible window
    if (currentTime != null) {
      const idx = Math.max(visible.min, Math.min(currentTime, visible.max));
      return { mode: "timepoint" as const, idx, range: visible };
    }

    // No selection → average over visible window
    const start = Math.max(fullRange.min, visible.min);
    const end = Math.min(fullRange.max, visible.max);
    return { mode: "average" as const, idx: null, range: { min: start, max: end } };
  }, [currentTime, time.length, timeRange]);

  // Build contributions for either a single timepoint or an average over a range
  const pieData = useMemo(() => {
    if (!selection || losses.length === 0) return null;

    const F = losses.length;

    // Compute contribution per feature
    const rows = new Array<{ name: string; val: number }>(F);

    if (selection.mode === "timepoint" && selection.idx != null) {
      const t = selection.idx;
      for (let f = 0; f < F; f++) {
        const v = losses[f]?.[t] ?? 0;
        rows[f] = { name: features[f], val: Math.max(0, v) };
      }
    } else {
      const start = selection.range.min;
      const end = selection.range.max;
      const count = Math.max(1, end - start + 1);
      for (let f = 0; f < F; f++) {
        let sum = 0;
        for (let t = start; t <= end; t++) sum += losses[f]?.[t] ?? 0;
        const avg = sum / count;
        rows[f] = { name: features[f], val: Math.max(0, avg) };
      }
    }

    // Sort descending
    rows.sort((a, b) => b.val - a.val);

    // Top-N and "Other"
    const k = Math.max(1, Math.min(topN, rows.length));
    const top = rows.slice(0, k);
    const rest = rows.slice(k);

    const sumTop = top.reduce((acc, r) => acc + r.val, 0);
    const sumRest = rest.reduce((acc, r) => acc + r.val, 0);
    const total = sumTop + sumRest;

    if (total <= 0) {
      return {
        labels: ["No signal"],
        values: [1],
        meta: selection,
        total: 0,
      };
    }

    const labels = top.map((r) => r.name);
    const values = top.map((r) => r.val);
    if (sumRest > 0) {
      labels.push("Other");
      values.push(sumRest);
    }

    return {
      labels,
      values,
      meta: selection,
      total,
    };
  }, [selection, losses, features, topN]);

  const subtitle = useMemo(() => {
    if (!pieData) return "Loading…";
    const m = pieData.meta;
    if (m.mode === "timepoint" && m.idx != null) return `t = ${m.idx}`;
    return `Avg over t = ${m.range.min} … ${m.range.max}`;
  }, [pieData]);

  return (
    <div className="h-full min-h-0 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-1">
          Top-N:
          <select
            value={topN}
            onChange={(e) => setTopN(parseInt(e.target.value, 10))}
            className="border rounded px-2 py-1"
          >
            {[5, 10, 15, 20, 30].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <span className="text-gray-500 ml-auto">{subtitle}</span>
      </div>

      <div className="flex-1 min-h-0">
        {pieData ? (
          <Plot
            data={[
              {
                type: "pie",
                labels: pieData.labels,
                values: pieData.values,
                textinfo: "label+percent",
                hovertemplate:
                  "%{label}<br>value=%{value:.4f}<br>%{percent}<extra></extra>",
                sort: false,
                hole: 0.35,
                pull: pieData.values.map((v, i, arr) =>
                  v === Math.max(...arr) ? 0.06 : 0
                ),
              } as any,
            ]}
            layout={{
              autosize: true,
              margin: { l: 10, r: 10, b: 10, t: 10 },
              legend: { orientation: "v" },
            }}
            style={{ width: "100%", height: "100%" }}
            config={{ displayModeBar: false }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Loading…
          </div>
        )}
      </div>
    </div>
  );
}
