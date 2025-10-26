import React from "react";
import Head from "next/head";
import { SharedCursorProvider } from "../components/SharedCursorContext";
import Card from "../components/Card";
import Quadrant1TrajectoryCesium from "../components/Quadrant1TrajectoryCesium"; // <-- new
import Quadrant2LossChart from "../components/Quadrant2LossChart";
import Quadrant3Controls from "../components/Quadrant3Controls";
import Quadrant4TopFeatures from "../components/Quadrant4TopFeatures";

export default function DashboardPage() {
  return (
    <>
      <Head>
        <title>Flight Anomaly Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <SharedCursorProvider>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "50% 50%",
            gridTemplateRows: "50% 50%",
            height: "100vh",
            width: "100vw",
            gap: "8px",
            padding: "8px",
            backgroundColor: "#f3f4f6",
            boxSizing: "border-box",
          }}
        >
          <Card title="Flight Trajectory (Globe)">
            <div style={{ height: "100%", minHeight: 0 }}>
              <Quadrant1TrajectoryCesium />
            </div>
          </Card>

          <Card title="Reconstruction Loss Over Time">
            <div style={{ height: "100%", minHeight: 0 }}>
              <Quadrant2LossChart />
            </div>
          </Card>

          <Card title="Control Panel">
            <div style={{ height: "100%", minHeight: 0, overflow: "auto", paddingRight: 4 }}>
              <Quadrant3Controls />
            </div>
          </Card>

          <Card title="Top Contributing Features">
            <div style={{ height: "100%", minHeight: 0 }}>
              <Quadrant4TopFeatures />
            </div>
          </Card>
        </div>
      </SharedCursorProvider>
    </>
  );
}
