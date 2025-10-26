"use client";
import React, { useEffect, useMemo, useState } from "react";
import Plot from "./Plot";
import { useSharedCursor } from "./SharedCursorContext";

interface Point3D {
  t: number; // time index (0..T-1)
  lat: number;
  lon: number;
  alt: number;
}

export default function Quadrant1Trajectory() {
  const { currentTime, setCurrentTime, timeRange, altRange } = useSharedCursor();
  const [data, setData] = useState<Point3D[]>([]);

  useEffect(() => {
    fetch("/api/trajectory")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  // Build a filtered view based on timeRange and altRange
  const filtered = useMemo(() => {
    if (!data.length) return [];
    return data.filter((d) => {
      const passTime =
        !timeRange || (d.t >= timeRange.min && d.t <= timeRange.max);
      const passAlt =
        !altRange || (d.alt >= altRange.min && d.alt <= altRange.max);
      return passTime && passAlt;
    });
  }, [data, timeRange, altRange]);

  if (data.length === 0) return <p>Loading trajectory...</p>;
  if (filtered.length === 0) return <p className="text-gray-600">No points in current filters.</p>;

  const xs = filtered.map((d) => d.lon);
  const ys = filtered.map((d) => d.lat);
  const zs = filtered.map((d) => d.alt);
  const times = filtered.map((d) => d.t);

  // Map hover pointIndex back to original time index
  const hoverHandler = (e: any) => {
    const idxFiltered = e?.points?.[0]?.pointIndex ?? null;
    if (idxFiltered == null) return;
    const t = times[idxFiltered];
    if (typeof t === "number") setCurrentTime(t);
  };

  // Only show the marker if the cursor is within both filters
  const showMarker =
    currentTime != null &&
    (!timeRange || (currentTime >= timeRange.min && currentTime <= timeRange.max)) &&
    data[currentTime] &&
    (!altRange || (data[currentTime].alt >= altRange.min && data[currentTime].alt <= altRange.max));

  return (
    <Plot
      data={[
        {
          type: "scatter3d",
          mode: "lines+markers",
          x: xs,
          y: ys,
          z: zs,
          line: { width: 4, color: "skyblue" },
          marker: { size: 3 },
          hovertemplate: "t=%{text}<br>z=%{z:.1f}<extra></extra>",
          text: times,
        },
        ...(showMarker
          ? [
              {
                type: "scatter3d",
                mode: "markers",
                x: [data[currentTime!].lon],
                y: [data[currentTime!].lat],
                z: [data[currentTime!].alt],
                marker: { size: 7, color: "red" },
                name: "selected",
              } as any,
            ]
          : []),
      ]}
      layout={{
        autosize: true,
        margin: { l: 0, r: 0, b: 0, t: 0 },
        scene: {
          xaxis: { title: "Longitude" },
          yaxis: { title: "Latitude" },
          zaxis: { title: "Altitude" },
        },
      }}
      style={{ width: "100%", height: "100%" }}
      onHover={hoverHandler}
      config={{ displayModeBar: false }}
    />
  );
}
