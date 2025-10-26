// src/pages/api/losses.ts
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Reconstruction loss ~ "how much the flight direction is changing"
 * ---------------------------------------------------------------
 * We compute a 3D velocity vector from the mock trajectory (lat, lon, alt),
 * then for each time index we measure the *average turn angle* (in radians)
 * over a 20-second rolling window (±10s around t). Loss increases with this
 * average directional change. Straight-and-level flight yields low loss.
 *
 * Output shape remains: { time: number[], avgLoss: number[] } with N=300.
 */

// --- Keep N consistent with /api/trajectory ---
const N = 300;

// Mock trajectory generator (identical logic to your current /api/trajectory)
function generateTrajectory() {
  const lat0 = 30.0;
  const lon0 = -97.0;

  const traj = Array.from({ length: N }, (_, i) => {
    const t = i;
    const x = i / (N - 1);

    // Altitude profile
    let alt: number;
    if (x < 0.15) {
      alt = 10000 * Math.sin((Math.PI / 2) * (x / 0.15));
    } else if (x < 0.8) {
      alt = 10000 + Math.sin(x * 8 * Math.PI) * 700;
    } else {
      const descentProgress = (x - 0.8) / 0.2;
      alt = 10000 * Math.cos((Math.PI / 2) * descentProgress);
      if (alt < 0) alt = 0;
    }

    // Horizontal path with turns & wiggles
    const lat =
      lat0 +
      0.2 * Math.sin(x * 2 * Math.PI) +
      0.05 * Math.sin(x * 10 * Math.PI);

    const lon =
      lon0 +
      0.4 * Math.sin(x * Math.PI) +
      0.2 * Math.sin(x * 3 * Math.PI) -
      0.1 * Math.sin(x * 12 * Math.PI);

    return { t, lat, lon, alt }; // alt in feet
  });

  return traj;
}

// Helpers
const FT_TO_M = 0.3048;
const DEG_TO_RAD = Math.PI / 180;
const METERS_PER_DEG_LAT = 111320; // approx

function metersPerDegLon(latDeg: number) {
  return METERS_PER_DEG_LAT * Math.cos(latDeg * DEG_TO_RAD);
}

function unit(v: [number, number, number]): [number, number, number] {
  const n = Math.hypot(v[0], v[1], v[2]);
  if (n === 0) return [0, 0, 0];
  return [v[0] / n, v[1] / n, v[2] / n];
}

function angleBetween(u: [number, number, number], v: [number, number, number]) {
  // clamp dot to [-1,1] to avoid NaNs from float error
  const dot = Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2]));
  return Math.acos(dot); // radians
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1) Build the same trajectory used by the globe
  const traj = generateTrajectory();

  // 2) Compute velocity vectors (dx, dy, dz) in meters per second (dt=1s)
  const v: [number, number, number][] = new Array(N).fill([0, 0, 0]);
  for (let i = 0; i < N - 1; i++) {
    const a = traj[i];
    const b = traj[i + 1];
    const mLon = metersPerDegLon((a.lat + b.lat) / 2);
    const dx = (b.lon - a.lon) * mLon; // meters (east)
    const dy = (b.lat - a.lat) * METERS_PER_DEG_LAT; // meters (north)
    const dz = (b.alt * FT_TO_M) - (a.alt * FT_TO_M); // meters (up)
    v[i] = [dx, dy, dz]; // dt = 1s → m/s numerically
  }
  v[N - 1] = v[N - 2]; // pad last

  // 3) Unit direction vectors of velocity
  const u: [number, number, number][] = v.map(unit);

  // 4) Instantaneous turn angles between successive directions
  //    ang[i] = angle between u[i-1] and u[i]  (i from 1..N-1)
  const ang: number[] = new Array(N).fill(0);
  for (let i = 1; i < N; i++) {
    ang[i] = angleBetween(u[i - 1], u[i]); // radians per step (~per second)
  }

  // 5) 20-second rolling window (±10s) average turn angle → "maneuver score"
  const windowRadius = 10; // seconds
  const maneuverScore: number[] = new Array(N).fill(0);
  for (let i = 0; i < N; i++) {
    const aIdx = Math.max(1, i - windowRadius);
    const bIdx = Math.min(N - 1, i + windowRadius);
    let sum = 0;
    let cnt = 0;
    for (let j = aIdx; j <= bIdx; j++) {
      sum += ang[j];
      cnt++;
    }
    const meanAngle = cnt > 0 ? sum / cnt : 0; // radians
    maneuverScore[i] = meanAngle;
  }

  // 6) Map maneuverScore → avgLoss with gentle scaling + small randomness
  //    meanAngle is in [0, ~pi]. Typical flying yields small angles.
  //    We scale so straight flight ~0.03–0.06, tight maneuvers can reach 0.3–0.5+
  const time = Array.from({ length: N }, (_, i) => i);
  const avgLoss = maneuverScore.map((m) => {
    let val = 0.01 + 0.45 * (m / Math.PI); // normalize by pi
    val += (Math.random() - 0.5) * 0.01;   // small noise
    return Math.max(0, val);
  });

  res.status(200).json({ time, avgLoss });
}
