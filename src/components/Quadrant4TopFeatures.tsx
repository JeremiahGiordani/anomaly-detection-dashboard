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

  const effectiveTimeIndex = useMemo(() => {
    if (currentTime == null || time.length === 0) return null;
    let idx = Math.max(0, Math.min(currentTime, time.length - 1));
    if (timeRange) {
      // Clamp within visible window
      idx = Math.max(timeRange.min, Math.min(idx, timeRange.max));
    }
    return idx;
  }, [currentTime, time.length, timeRange]);

  const top = useMemo(() => {
    const selIndex = effectiveTimeIndex;
    if (selIndex == null || losses.length === 0) return null;
    const F = losses.length;
    const pairs: Array<{ f: number; val: number }> = new Array(F);
    for (let f = 0; f < F; f++) {
      pairs[f] = { f, val: losses[f][selIndex] ?? 0 };
    }
    pairs.sort((a, b) => b.val - a.val);
    const K = Math.min(topN, pairs.length);
    const chosen = pairs.slice(0, K);
    return {
      names: chosen.map(({ f }) => features[f]),
      vals: chosen.map(({ val }) => val),
      selIndex,
    };
  }, [effectiveTimeIndex, losses, features, topN]);

  if (losses.length === 0) {
    return <p className="text-gray-600">Loading features…</p>;
  }

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-1">
          Top-N:
          <select
            value={topN}
            onChange={(e) => setTopN(parseInt(e.target.value, 10))}
            className="border rounded px-2 py-1"
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <span className="text-gray-500 ml-auto">
          {top?.selIndex == null
            ? "Select a time via hover/slider"
            : `t = ${top.selIndex}`}
        </span>
      </div>

      <div className="flex-1 min-h-0">
        {top && top.names.length > 0 ? (
          <Plot
            data={[
              {
                type: "bar",
                orientation: "h",
                y: top.names.slice().reverse(),
                x: top.vals.slice().reverse(),
                hovertemplate: "%{y}<br>loss=%{x:.3f}<extra></extra>",
              },
            ]}
            layout={{
              autosize: true,
              margin: { l: 160, r: 20, b: 30, t: 10 },
              xaxis: { title: "Loss" },
            }}
            style={{ width: "100%", height: "100%" }}
            config={{ displayModeBar: false }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            {effectiveTimeIndex == null ? "Move your cursor or time slider" : "No data"}
          </div>
        )}
      </div>
    </div>
  );
}
