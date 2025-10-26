import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // mock trajectory data
  const data = Array.from({ length: 100 }, (_, i) => ({
    t: i,
    lat: 30 + Math.sin(i / 10) * 0.5,
    lon: -97 + Math.cos(i / 10) * 0.5,
    alt: 1000 + Math.sin(i / 20) * 100,
  }));

  res.status(200).json({ trajectory: data });
}
