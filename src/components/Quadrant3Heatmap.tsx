"use client";
import React from "react";
import { useSharedCursor } from "./SharedCursorContext";

export default function Quadrant3Heatmap() {
  const { currentTime } = useSharedCursor();

  return (
    <div className="h-full flex flex-col items-center justify-center text-gray-700">
      <p>Feature × Time Heatmap (mocked)</p>
      <p className="text-sm text-gray-500">
        Highlighted time index → {currentTime ?? "none"}
      </p>
    </div>
  );
}
