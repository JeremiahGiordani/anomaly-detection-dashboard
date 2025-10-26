import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Mock flight trajectory: 300 points forming a complex climb, turn, and descent.
 * - Starts near Austin, TX (30°N, -97°W)
 * - Climb phase: alt from 1,000 → 30,000 ft
 * - Cruise: wide right-hand turn (0.5° radius)
 * - Descent: spiral down back toward start point
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const points = 300;
  const climbEnd = 80;
  const cruiseEnd = 180;
  const baseLat = 30.0;
  const baseLon = -97.0;

  const data = Array.from({ length: points }, (_, i) => {
    let lat = baseLat;
    let lon = baseLon;
    let alt = 1000;

    if (i < climbEnd) {
      // climb straight east
      lat += i * 0.002;
      lon += i * 0.003;
      alt = 1000 + (i / climbEnd) * 29000;
    } else if (i < cruiseEnd) {
      // gentle right turn (northward arc)
      const t = (i - climbEnd) / (cruiseEnd - climbEnd);
      const angle = t * Math.PI; // 180° arc
      lat = baseLat + 0.25 * Math.sin(angle);
      lon = baseLon + 0.25 * (1 - Math.cos(angle));
      alt = 30000 + Math.sin(t * 4 * Math.PI) * 500; // small oscillation
    } else {
      // descending spiral toward origin
      const t = (i - cruiseEnd) / (points - cruiseEnd);
      const angle = 4 * Math.PI * t;
      const radius = 0.25 * (1 - t);
      lat = baseLat + radius * Math.cos(angle);
      lon = baseLon + radius * Math.sin(angle);
      alt = 30000 - t * 29000;
    }

    return { t: i, lat, lon, alt };
  });

  res.status(200).json(data);
}
