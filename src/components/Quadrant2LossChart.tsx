"use client";
import React from "react";
import { useSharedCursor } from "./SharedCursorContext";

export default function Quadrant2LossChart() {
  const { currentTime, setCurrentTime } = useSharedCursor();

  const handleHover = (t: number) => setCurrentTime(t);

  return (
    <div
      className="h-full flex items-center justify-center text-gray-700 cursor-pointer"
      onMouseMove={() => handleHover(Math.floor(Math.random() * 100))}
    >
      <div className="text-center">
        <p>Loss over Time (mocked)</p>
        <p className="text-sm text-gray-500">
          Shared cursor index → {currentTime ?? "none"}
        </p>
      </div>
    </div>
  );
}
