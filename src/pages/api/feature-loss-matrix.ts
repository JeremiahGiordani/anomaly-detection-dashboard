import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Mock generator for a feature x time loss matrix.
 * - F = number of features (e.g., 120)
 * - T = number of time steps (e.g., 600)
 * Values are synthesized with smooth patterns + noise to look realistic.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const F = 120;
  const T = 600;

  // Mock feature names with some realistic groups
  const features = Array.from({ length: F }, (_, i) => {
    const group =
      i % 6 === 0 ? "engine" :
      i % 6 === 1 ? "nav" :
      i % 6 === 2 ? "airframe" :
      i % 6 === 3 ? "env" :
      i % 6 === 4 ? "elec" : "control";
    return `${group}_param_${String(i).padStart(3, "0")}`;
  });

  const time = Array.from({ length: T }, (_, t) => t); // pretend seconds or 10s windows

  // Build a matrix with banded structure + occasional spikes
  const losses: number[][] = Array.from({ length: F }, (_, f) => {
    const base = 0.01 + (f % 7) * 0.003;
    const freq = 0.02 + (f % 9) * 0.0015; // variety across features
    const phase = (f * 17) % 63;

    return Array.from({ length: T }, (_, t) => {
      const seasonal = Math.abs(Math.sin((t + phase) * freq)) * (0.15 + (f % 5) * 0.02);
      const drift = (Math.sin(t * 0.002 + f * 0.01) + 1) * 0.02;
      const noise = (Math.random() - 0.5) * 0.01;
      // occasional localized spike bands
      const spike =
        (t > 180 && t < 220 && f % 8 === 0) ||
        (t > 420 && t < 440 && (f % 11 === 3 || f % 11 === 7))
          ? 0.25 + Math.random() * 0.1
          : 0;

      return Math.max(0, base + seasonal + drift + spike + noise);
    });
  });

  res.status(200).json({ features, time, losses });
}
