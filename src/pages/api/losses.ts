import type { NextApiRequest, NextApiResponse } from "next";

// mock reconstruction loss time-series (100 timepoints)
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const data = Array.from({ length: 100 }, (_, i) => ({
    t: i,
    avg_loss: 0.05 + Math.abs(Math.sin(i / 10)) * 0.3 + Math.random() * 0.02,
  }));

  res.status(200).json(data);
}
