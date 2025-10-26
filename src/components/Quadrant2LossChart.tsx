// src/components/Quadrant2LossChart.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "./Plot";
import { useSharedCursor } from "./SharedCursorContext";

type LossPayloadLoose =
  | { time?: number[]; avgLoss?: number[]; t?: number[]; loss?: number[] }
  | number[];

function toNumbers(arr: any): number[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((v) => (typeof v === "number" && Number.isFinite(v) ? v : Number(v)))
    .filter((v) => Number.isFinite(v));
}

function percentile(values: number[], p: number): number {
  if (!values || values.length === 0) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const r = p * (arr.length - 1);
  const i = Math.floor(r);
  const f = r - i;
  if (i + 1 < arr.length) return arr[i] * (1 - f) + arr[i + 1] * f;
  return arr[i];
}

export default function Quadrant2LossChart() {
  const { currentTime, timeRange } = useSharedCursor();

  const [time, setTime] = useState<number[]>([]);
  const [avgLoss, setAvgLoss] = useState<number[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/losses")
      .then((r) => r.json())
      .then((raw: LossPayloadLoose) => {
        if (cancelled) return;

        // Normalize payload to {time, avgLoss}
        let t: number[] = [];
        let y: number[] = [];

        if (Array.isArray(raw)) {
          // flat numeric array -> treat as losses; synthesize time
          y = toNumbers(raw);
          t = Array.from({ length: y.length }, (_, i) => i);
        } else if (raw && typeof raw === "object") {
          const candidatesTime = toNumbers((raw as any).time ?? (raw as any).t);
          const candidatesLoss = toNumbers((raw as any).avgLoss ?? (raw as any).loss);
          y = candidatesLoss;
          if (candidatesTime.length === y.length && y.length > 0) {
            t = candidatesTime;
          } else if (y.length > 0) {
            t = Array.from({ length: y.length }, (_, i) => i);
          }
        }

        // Sync lengths conservatively
        const n = Math.max(0, Math.min(t.length, y.length));
        const T = t.slice(0, n);
        const Y = y.slice(0, n);

        if (n === 0) {
          setLoadError("No loss data available.");
          setTime([]);
          setAvgLoss([]);
          return;
        }

        setTime(T);
        setAvgLoss(Y);
        setLoadError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        setLoadError("Failed to load losses.");
        setTime([]);
        setAvgLoss([]);
        console.error(e);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasData = time.length > 0 && avgLoss.length === time.length;

  // Visible range indices
  const visibleIdx = useMemo(() => {
    if (!hasData) return { i0: 0, i1: -1 };
    const N = time.length;
    const minIdx = timeRange ? Math.max(0, Math.min(N - 1, timeRange.min)) : 0;
    const maxIdx = timeRange ? Math.max(0, Math.min(N - 1, timeRange.max)) : N - 1;
    return { i0: Math.min(minIdx, maxIdx), i1: Math.max(minIdx, maxIdx) };
  }, [hasData, time.length, timeRange]);

  // Slice visible data
  const vis = useMemo(() => {
    if (!hasData || visibleIdx.i1 < visibleIdx.i0) return { t: [] as number[], y: [] as number[] };
    return {
      t: time.slice(visibleIdx.i0, visibleIdx.i1 + 1),
      y: avgLoss.slice(visibleIdx.i0, visibleIdx.i1 + 1),
    };
  }, [hasData, time, avgLoss, visibleIdx]);

  // 95th percentile threshold on the visible subset
  const threshold = useMemo(() => percentile(vis.y, 0.95), [vis.y]);

  // Partition points into below / above threshold
  const dots = useMemo(() => {
    const below = { x: [] as number[], y: [] as number[] };
    const above = { x: [] as number[], y: [] as number[] };
    for (let i = 0; i < vis.t.length; i++) {
      const x = vis.t[i];
      const y = vis.y[i];
      if (!Number.isFinite(y)) continue;
      if (y <= threshold) {
        below.x.push(x);
        below.y.push(y);
      } else {
        above.x.push(x);
        above.y.push(y);
      }
    }
    return { below, above };
  }, [vis, threshold]);

  // Selected point from control panel (only if inside visible slice)
  const selectedPoint = useMemo(() => {
    if (!hasData || currentTime == null) return null;
    if (currentTime < visibleIdx.i0 || currentTime > visibleIdx.i1) return null;
    const y = avgLoss[currentTime];
    const x = time[currentTime];
    return Number.isFinite(y) ? { x, y } : null;
  }, [hasData, currentTime, visibleIdx, time, avgLoss]);

  // Build Plotly traces (explicit colors)
  const traces: Partial<Plotly.PlotData>[] = useMemo(() => {
    if (!hasData) return [];

    const belowTrace: Partial<Plotly.PlotData> = {
      type: "scatter",
      mode: "markers",
      name: "below threshold",
      x: dots.below.x,
      y: dots.below.y,
      marker: { size: 6, opacity: 0.85, color: "rgb(34, 197, 94)" }, // green-500
    };

    const aboveTrace: Partial<Plotly.PlotData> = {
      type: "scatter",
      mode: "markers",
      name: "above threshold",
      x: dots.above.x,
      y: dots.above.y,
      marker: { size: 6, opacity: 0.95, color: "rgb(239, 68, 68)" }, // red-500
    };

    const arr: Partial<Plotly.PlotData>[] = [belowTrace, aboveTrace];

    if (selectedPoint) {
      arr.push({
        type: "scatter",
        mode: "markers",
        name: "selected",
        x: [selectedPoint.x],
        y: [selectedPoint.y],
        marker: {
          size: 9,
          color: "rgb(234, 179, 8)", // yellow-500
          line: { width: 1, color: "black" },
          symbol: "circle",
        },
        showlegend: false,
        hoverinfo: "skip",
      });
    }

    return arr;
  }, [hasData, dots, selectedPoint]);

  // Layout with dotted horizontal threshold line
  const layout: Partial<Plotly.Layout> = useMemo(() => {
    const x0 = vis.t.length ? vis.t[0] : undefined;
    const x1 = vis.t.length ? vis.t[vis.t.length - 1] : undefined;
    return {
      autosize: true,
      margin: { l: 54, r: 10, t: 10, b: 38 },
      hovermode: false, // no mouse interaction
      legend: { orientation: "h" },
      xaxis: {
        title: "time (t)",
        range: x0 != null && x1 != null ? [x0, x1] : undefined,
        fixedrange: false,
      },
      yaxis: { title: "avg reconstruction loss", rangemode: "tozero" },
      shapes: Number.isFinite(threshold)
        ? [
            {
              type: "line",
              xref: "paper",
              x0: 0,
              x1: 1,
              yref: "y",
              y0: threshold,
              y1: threshold,
              line: { dash: "dot", width: 2, color: "rgba(55,55,55,0.8)" },
            } as any,
          ]
        : [],
    };
  }, [vis.t, threshold]);

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center text-red-500 text-sm">
        {loadError}
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
      <Plot
        data={traces as any}
        layout={layout}
        style={{ width: "100%", height: "100%" }}
        config={{ displayModeBar: false }}
      />
    </div>
  );
}
