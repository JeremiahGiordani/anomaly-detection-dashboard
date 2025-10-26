// src/pages/api/trajectory.ts
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Mock realistic flight trajectory for 300 time steps.
 * - Starts on ground (alt = 0)
 * - Takes off and climbs in a curved ascent
 * - Cruises with altitude oscillations and gentle heading changes
 * - Makes a wide banked turn
 * - Descends and lands near starting point
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const N = 300;
  const lat0 = 30.0;
  const lon0 = -97.0;

  const data = Array.from({ length: N }, (_, i) => {
    const t = i;
    const x = i / (N - 1);

    // Altitude profile
    let alt: number;
    if (x < 0.15) {
      // takeoff and climb
      alt = 10000 * Math.sin((Math.PI / 2) * (x / 0.15));
    } else if (x < 0.8) {
      // cruise with small oscillations
      alt = 10000 + Math.sin(x * 8 * Math.PI) * 700;
    } else {
      // descent and landing
      const descentProgress = (x - 0.8) / 0.2;
      alt = 10000 * Math.cos((Math.PI / 2) * descentProgress);
      if (alt < 0) alt = 0;
    }

    // Horizontal path (combination of turns, offsets, and oscillations)
    // Adds realistic variation — not a perfect loop
    const lat = lat0
      + 0.2 * Math.sin(x * 2 * Math.PI)
      + 0.05 * Math.sin(x * 10 * Math.PI); // small turbulence-like wiggle

    const lon = lon0
      + 0.4 * Math.sin(x * Math.PI)     // gradual eastward drift
      + 0.2 * Math.sin(x * 3 * Math.PI) // big right-hand banked turn
      - 0.1 * Math.sin(x * 12 * Math.PI); // smaller high-frequency wobble

    return { t, lat, lon, alt };
  });

  res.status(200).json(data);
}
