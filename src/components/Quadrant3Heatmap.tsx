"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useSharedCursor } from "./SharedCursorContext";

/**
 * Control panel that manages:
 * - Time window: bottom (min), selected (cursor), top (max).
 * - Altitude window: bottom (min), top (max).
 *
 * Behavior:
 * - Initializes slider ranges from dataset (trajectory + losses).
 * - Moving the "selected" time slider updates the global cursor (same as hover).
 * - Adjusting time min/max filters what Quadrants 1 & 2 render.
 * - Adjusting altitude min/max filters what Quadrant 1 renders.
 */
export default function Quadrant3Controls() {
  const {
    currentTime,
    setCurrentTime,
    timeRange,
    setTimeRange,
    altRange,
    setAltRange,
    timeDomain,
    setTimeDomain,
    altDomain,
    setAltDomain,
  } = useSharedCursor();

  // Local slider states (so we can clamp/order before committing)
  const [timeMin, setTimeMin] = useState<number | null>(null);
  const [timeSel, setTimeSel] = useState<number | null>(null);
  const [timeMax, setTimeMax] = useState<number | null>(null);

  const [altMin, setAltMin] = useState<number | null>(null);
  const [altMax, setAltMax] = useState<number | null>(null);

  // Fetch domains once (time length from /api/losses; altitude range from /api/trajectory)
  useEffect(() => {
    // Discover time domain
    fetch("/api/losses")
      .then((r) => r.json())
      .then((arr) => {
        const T = Array.isArray(arr) ? arr.length : (arr?.length ?? 0);
        // API returns [{t, avg_loss}], so length = T
        const domain = { min: 0, max: Math.max(0, T - 1) };
        if (!timeDomain) setTimeDomain(domain);
        if (!timeRange) setTimeRange(domain);
        if (timeMin == null) setTimeMin(domain.min);
        if (timeMax == null) setTimeMax(domain.max);
        if (timeSel == null) setTimeSel(Math.floor((domain.min + domain.max) / 2));
      })
      .catch(console.error);

    // Discover altitude domain
    fetch("/api/trajectory")
      .then((r) => r.json())
      .then((traj) => {
        const alts: number[] = Array.isArray(traj) ? traj.map((d: any) => d.alt) : [];
        const minAlt = alts.length ? Math.min(...alts) : 0;
        const maxAlt = alts.length ? Math.max(...alts) : 1000;
        const domain = { min: minAlt, max: maxAlt };
        if (!altDomain) setAltDomain(domain);
        if (!altRange) setAltRange(domain);
        if (altMin == null) setAltMin(domain.min);
        if (altMax == null) setAltMax(domain.max);
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep local sliders in sync if external range changes elsewhere
  useEffect(() => {
    if (timeRange && (timeMin == null || timeMax == null)) {
      setTimeMin(timeRange.min);
      setTimeMax(timeRange.max);
    }
  }, [timeRange, timeMin, timeMax]);

  useEffect(() => {
    if (altRange && (altMin == null || altMax == null)) {
      setAltMin(altRange.min);
      setAltMax(altRange.max);
    }
  }, [altRange, altMin, altMax]);

  // Clamp helpers
  const timeDom = timeDomain ?? { min: 0, max: 0 };
  const altDom = altDomain ?? { min: 0, max: 1000 };

  const commitTimeRange = (minVal: number, maxVal: number) => {
    const min = Math.max(timeDom.min, Math.min(minVal, maxVal));
    const max = Math.min(timeDom.max, Math.max(minVal, maxVal));
    setTimeRange({ min, max });
    // Also clamp the cursor inside the new range
    if (currentTime == null || currentTime < min || currentTime > max) {
      const mid = Math.floor((min + max) / 2);
      setCurrentTime(mid);
      setTimeSel(mid);
    }
  };

  const commitAltRange = (minVal: number, maxVal: number) => {
    const min = Math.max(altDom.min, Math.min(minVal, maxVal));
    const max = Math.min(altDom.max, Math.max(minVal, maxVal));
    setAltRange({ min, max });
  };

  // Handlers
  const onTimeMinChange = (v: number) => {
    if (timeMax == null) return;
    const newMin = Math.min(v, timeMax);
    setTimeMin(newMin);
    if (timeSel != null && newMin > timeSel) {
      setTimeSel(newMin);
      setCurrentTime(newMin);
    }
    commitTimeRange(newMin, timeMax);
  };

  const onTimeMaxChange = (v: number) => {
    if (timeMin == null) return;
    const newMax = Math.max(v, timeMin);
    setTimeMax(newMax);
    if (timeSel != null && newMax < timeSel) {
      setTimeSel(newMax);
      setCurrentTime(newMax);
    }
    commitTimeRange(timeMin, newMax);
  };

  const onTimeSelChange = (v: number) => {
    if (timeMin == null || timeMax == null) return;
    const clamped = Math.max(timeMin, Math.min(v, timeMax));
    setTimeSel(clamped);
    setCurrentTime(clamped);
  };

  const onAltMinChange = (v: number) => {
    if (altMax == null) return;
    const newMin = Math.min(v, altMax);
    setAltMin(newMin);
    commitAltRange(newMin, altMax);
  };

  const onAltMaxChange = (v: number) => {
    if (altMin == null) return;
    const newMax = Math.max(v, altMin);
    setAltMax(newMax);
    commitAltRange(altMin, newMax);
  };

  const prettyTime = (t: number | null) => (t == null ? "—" : t.toString());
  const prettyAlt = (a: number | null) => (a == null ? "—" : a.toFixed(1));

  // Slider step sizes
  const timeStep = 1;
  // Derive a reasonable step for altitude based on domain span
  const altStep = useMemo(() => {
    const span = altDom.max - altDom.min;
    if (!isFinite(span) || span <= 0) return 1;
    const raw = span / 200; // ~200 steps across the slider
    const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
    return Math.max(0.1, Math.round(raw / pow10) * pow10);
  }, [altDom]);

  return (
    <div className="h-full flex flex-col gap-4">
      <section>
        <h3 className="font-semibold mb-2">Time Window</h3>
        <div className="space-y-3">
          {/* Bottom (min) */}
          <div>
            <label className="text-sm font-medium">Start (min)</label>
            <input
              type="range"
              min={timeDom.min}
              max={timeDom.max}
              step={timeStep}
              value={timeMin ?? timeDom.min}
              onChange={(e) => onTimeMinChange(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="text-xs text-gray-600">
              Showing from <b>{prettyTime(timeMin)}</b>
            </div>
          </div>

          {/* Selected (cursor) */}
          <div>
            <label className="text-sm font-medium">Selected (cursor)</label>
            <input
              type="range"
              min={timeDom.min}
              max={timeDom.max}
              step={timeStep}
              value={timeSel ?? (currentTime ?? timeDom.min)}
              onChange={(e) => onTimeSelChange(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="text-xs text-gray-600">
              Current t = <b>{prettyTime(timeSel ?? currentTime)}</b>
            </div>
          </div>

          {/* Top (max) */}
          <div>
            <label className="text-sm font-medium">End (max)</label>
            <input
              type="range"
              min={timeDom.min}
              max={timeDom.max}
              step={timeStep}
              value={timeMax ?? timeDom.max}
              onChange={(e) => onTimeMaxChange(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="text-xs text-gray-600">
              Showing to <b>{prettyTime(timeMax)}</b>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Range: <b>{prettyTime(timeMin)}</b> → <b>{prettyTime(timeMax)}</b>
          </div>
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">Altitude (Z) Window</h3>
        <div className="space-y-3">
          {/* Bottom (min) */}
          <div>
            <label className="text-sm font-medium">Min altitude</label>
            <input
              type="range"
              min={altDom.min}
              max={altDom.max}
              step={altStep}
              value={altMin ?? altDom.min}
              onChange={(e) => onAltMinChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-600">
              Min z = <b>{prettyAlt(altMin)}</b>
            </div>
          </div>

          {/* Top (max) */}
          <div>
            <label className="text-sm font-medium">Max altitude</label>
            <input
              type="range"
              min={altDom.min}
              max={altDom.max}
              step={altStep}
              value={altMax ?? altDom.max}
              onChange={(e) => onAltMaxChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-600">
              Max z = <b>{prettyAlt(altMax)}</b>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Range: <b>{prettyAlt(altMin)}</b> → <b>{prettyAlt(altMax)}</b>
          </div>
        </div>
      </section>
    </div>
  );
}
