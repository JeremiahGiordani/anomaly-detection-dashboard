"use client";
import React from "react";
import { useSharedCursor } from "./SharedCursorContext";

export default function Quadrant4TopFeatures() {
  const { currentTime } = useSharedCursor();

  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-700">
      <p>Top Contributing Features (mocked)</p>
      <p className="text-sm text-gray-500">
        Current time index → {currentTime ?? "none"}
      </p>
    </div>
  );
}
