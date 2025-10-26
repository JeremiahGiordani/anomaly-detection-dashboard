"use client";
import React, { createContext, useContext, useState } from "react";

export interface Range {
  min: number;
  max: number;
}

interface CursorContextType {
  // Global cursor (time index)
  currentTime: number | null;
  setCurrentTime: (val: number | null) => void;

  // Time range filter, in time indices [0..T-1]
  timeRange: Range | null;
  setTimeRange: (r: Range | null) => void;

  // Altitude (z) range filter, in same units as data.alt
  altRange: Range | null;
  setAltRange: (r: Range | null) => void;

  // Optional: domains discovered from data (for initializing sliders)
  timeDomain: Range | null;
  setTimeDomain: (r: Range | null) => void;

  altDomain: Range | null;
  setAltDomain: (r: Range | null) => void;
}

const SharedCursorContext = createContext<CursorContextType>({
  currentTime: null,
  setCurrentTime: () => {},
  timeRange: null,
  setTimeRange: () => {},
  altRange: null,
  setAltRange: () => {},
  timeDomain: null,
  setTimeDomain: () => {},
  altDomain: null,
  setAltDomain: () => {},
});

export const SharedCursorProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<Range | null>(null);
  const [altRange, setAltRange] = useState<Range | null>(null);
  const [timeDomain, setTimeDomain] = useState<Range | null>(null);
  const [altDomain, setAltDomain] = useState<Range | null>(null);

  return (
    <SharedCursorContext.Provider
      value={{
        currentTime,
        setCurrentTime,
        timeRange,
        setTimeRange,
        altRange,
        setAltRange,
        timeDomain,
        setTimeDomain,
        altDomain,
        setAltDomain,
      }}
    >
      {children}
    </SharedCursorContext.Provider>
  );
};

export const useSharedCursor = () => useContext(SharedCursorContext);
