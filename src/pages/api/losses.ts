// src/pages/api/losses.ts
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Mock average reconstruction loss over time for 300 steps.
 * Shapes the distribution so ~5–10% of points are clear outliers.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const N = 300;
  const time = Array.from({ length: N }, (_, i) => i);

  // Base: smooth low loss with periodic bumps
  const base = (i: number) =>
    0.02 +
    0.01 * Math.sin(i / 12) +
    0.008 * Math.cos(i / 7) +
    Math.max(0, (i - 240) / 2000); // slight drift up near the end

  // Inject sparse outliers (higher loss spikes)
  const spikes = new Set<number>();
  for (let k = 0; k < Math.floor(N * 0.07); k++) {
    const idx = Math.floor(Math.random() * N);
    spikes.add(idx);
  }

  const avgLoss = time.map((i) => {
    const noise = (Math.random() - 0.5) * 0.004; // small noise
    const val = base(i) + noise;
    if (spikes.has(i)) {
      // big spike
      return Math.max(0, val + 0.05 + Math.random() * 0.07);
    }
    return Math.max(0, val);
  });

  res.status(200).json({ time, avgLoss });
}
