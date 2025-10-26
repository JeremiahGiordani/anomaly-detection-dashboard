import React from "react";
import Head from "next/head";
import { SharedCursorProvider } from "../components/SharedCursorContext";
import Quadrant1Trajectory from "../components/Quadrant1Trajectory";
import Quadrant2LossChart from "../components/Quadrant2LossChart";
import Quadrant3Heatmap from "../components/Quadrant3Heatmap";
import Quadrant4TopFeatures from "../components/Quadrant4TopFeatures";

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>Flight Anomaly Dashboard</title>
      </Head>
      <SharedCursorProvider>
        <main className="h-screen w-screen grid grid-cols-2 grid-rows-2 gap-2 p-2 bg-gray-50">
          <div className="border rounded-lg bg-white shadow p-2">
            <h2 className="font-semibold text-lg mb-1">Flight Trajectory</h2>
            <Quadrant1Trajectory />
          </div>

          <div className="border rounded-lg bg-white shadow p-2">
            <h2 className="font-semibold text-lg mb-1">Reconstruction Loss Over Time</h2>
            <Quadrant2LossChart />
          </div>

          <div className="border rounded-lg bg-white shadow p-2">
            <h2 className="font-semibold text-lg mb-1">Feature Loss Heatmap</h2>
            <Quadrant3Heatmap />
          </div>

          <div className="border rounded-lg bg-white shadow p-2">
            <h2 className="font-semibold text-lg mb-1">Top Contributing Features</h2>
            <Quadrant4TopFeatures />
          </div>
        </main>
      </SharedCursorProvider>
    </>
  );
}
