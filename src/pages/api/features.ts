import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const groups = ["engine", "nav", "airframe", "env", "elec", "control"];
  const meta = groups.map((g) => ({ group: g, color: null, description: `${g} subsystem` }));
  res.status(200).json({ groups: meta });
}
