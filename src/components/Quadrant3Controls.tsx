// src/components/Quadrant3ControlPanel.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useSharedCursor } from "./SharedCursorContext";

export default function Quadrant3ControlPanel() {
  const {
    timeRange,
    setTimeRange,
    altRange,
    setAltRange,
    currentTime,
    setCurrentTime,
  } = useSharedCursor();

  const [timeDomain, setTimeDomain] = useState({ min: 0, max: 0 });
  const [altDomain, setAltDomain] = useState({ min: 0, max: 0 });

  // Discover time range from /api/losses
  useEffect(() => {
    fetch("/api/losses")
      .then((r) => r.json())
      .then((data) => {
        let len = 0;
        if (Array.isArray(data)) len = data.length;
        else if (data?.time?.length) len = data.time.length;
        else if (data?.avgLoss?.length) len = data.avgLoss.length;
        else if (data?.t?.length) len = data.t.length;

        const domain = { min: 0, max: Math.max(0, len - 1) };
        setTimeDomain(domain);
        setTimeRange?.(domain);
        setCurrentTime?.(0);
      })
      .catch(console.error);
  }, []);

  // Discover altitude range from /api/trajectory
  useEffect(() => {
    fetch("/api/trajectory")
      .then((r) => r.json())
      .then((arr) => {
        if (!Array.isArray(arr) || arr.length === 0) return;
        const minAlt = Math.min(...arr.map((p) => p.alt ?? 0));
        const maxAlt = Math.max(...arr.map((p) => p.alt ?? 0));
        const domain = { min: minAlt, max: maxAlt };
        setAltDomain(domain);
        setAltRange?.(domain);
      })
      .catch(console.error);
  }, []);

  const onTimeMinChange = (v: number) => {
    const newRange = { min: v, max: timeRange?.max ?? timeDomain.max };
    setTimeRange?.(newRange);
  };

  const onTimeMaxChange = (v: number) => {
    const newRange = { min: timeRange?.min ?? timeDomain.min, max: v };
    setTimeRange?.(newRange);
  };

  const onTimeSelChange = (v: number) => setCurrentTime?.(v);

  const onAltMinChange = (v: number) => {
    const newRange = { min: v, max: altRange?.max ?? altDomain.max };
    setAltRange?.(newRange);
  };

  const onAltMaxChange = (v: number) => {
    const newRange = { min: altRange?.min ?? altDomain.min, max: v };
    setAltRange?.(newRange);
  };

  return (
    <div className="h-full w-full p-3 space-y-4 text-sm">
      <div className="font-semibold">Control Panel</div>

      {/* Time controls */}
      <div className="space-y-2">
        <div className="text-xs text-gray-600">Time Window</div>

        <label className="block text-xs">Min</label>
        <input
          type="range"
          min={timeDomain.min}
          max={timeDomain.max}
          value={timeRange?.min ?? timeDomain.min}
          onChange={(e) => onTimeMinChange(Number(e.target.value))}
          className="w-full"
        />

        <label className="block text-xs">Selected</label>
        <input
          type="range"
          min={timeRange?.min ?? timeDomain.min}
          max={timeRange?.max ?? timeDomain.max}
          value={currentTime ?? 0}
          onChange={(e) => onTimeSelChange(Number(e.target.value))}
          className="w-full"
        />

        <label className="block text-xs">Max</label>
        <input
          type="range"
          min={timeDomain.min}
          max={timeDomain.max}
          value={timeRange?.max ?? timeDomain.max}
          onChange={(e) => onTimeMaxChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Altitude controls */}
      <div className="space-y-2 pt-4">
        <div className="text-xs text-gray-600">Altitude (ft)</div>

        <label className="block text-xs">Min</label>
        <input
          type="range"
          min={altDomain.min}
          max={altDomain.max}
          value={altRange?.min ?? altDomain.min}
          onChange={(e) => onAltMinChange(Number(e.target.value))}
          className="w-full"
        />

        <label className="block text-xs">Max</label>
        <input
          type="range"
          min={altDomain.min}
          max={altDomain.max}
          value={altRange?.max ?? altDomain.max}
          onChange={(e) => onAltMaxChange(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}
