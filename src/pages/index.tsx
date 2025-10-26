import React from "react";
import Head from "next/head";
import { SharedCursorProvider } from "../components/SharedCursorContext";
import Card from "../components/Card";
import Quadrant1Trajectory from "../components/Quadrant1Trajectory";
import Quadrant2LossChart from "../components/Quadrant2LossChart";
import Quadrant3Controls from "../components/Quadrant3Controls";
import Quadrant4TopFeatures from "../components/Quadrant4TopFeatures";

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>Flight Anomaly Dashboard</title>
      </Head>

      <SharedCursorProvider>
        {/* Full-viewport canvas */}
        <div className="h-screen w-screen bg-gray-100">
          {/* Page padding */}
          <div className="h-full w-full p-3">
            {/* 2×2 Quadrant Grid */}
            <div
              className="
                grid h-full w-full gap-3
                grid-cols-1 md:grid-cols-2
                grid-rows-4 md:grid-rows-2
                auto-rows-fr
              "
              // Ensure exact 2 equal-height rows on md+ screens
              style={{ gridTemplateRows: "1fr 1fr" }}
            >
              <Card title="Flight Trajectory">
                {/* Make the child fill the card body */}
                <div className="h-full min-h-0">
                  <Quadrant1Trajectory />
                </div>
              </Card>

              <Card title="Reconstruction Loss Over Time">
                <div className="h-full min-h-0">
                  <Quadrant2LossChart />
                </div>
              </Card>

              <Card title="Control Panel">
                {/* Controls can scroll if they overflow */}
                <div className="h-full min-h-0 overflow-auto pr-1">
                  <Quadrant3Controls />
                </div>
              </Card>

              <Card title="Top Contributing Features">
                <div className="h-full min-h-0">
                  <Quadrant4TopFeatures />
                </div>
              </Card>
            </div>
          </div>
        </div>
      </SharedCursorProvider>
    </>
  );
}
