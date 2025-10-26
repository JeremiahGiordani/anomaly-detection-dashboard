"use client";
import React from "react";
import { useSharedCursor } from "./SharedCursorContext";

export default function Quadrant1Trajectory() {
  const { currentTime, setCurrentTime } = useSharedCursor();

  // placeholder - in the future this will be a 3D Plotly chart
  const handleHover = (t: number) => setCurrentTime(t);

  return (
    <div
      className="h-full flex items-center justify-center text-gray-700 cursor-pointer"
      onMouseMove={() => handleHover(Math.floor(Math.random() * 100))}
    >
      <div className="text-center">
        <p>3D Trajectory (mocked)</p>
        <p className="text-sm text-gray-500">
          Hover updates time index → {currentTime ?? "none"}
        </p>
      </div>
    </div>
  );
}
