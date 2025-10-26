"use client";
import React, { createContext, useContext, useState } from "react";

interface CursorContextType {
  currentTime: number | null;
  setCurrentTime: (val: number | null) => void;
}

const SharedCursorContext = createContext<CursorContextType>({
  currentTime: null,
  setCurrentTime: () => {},
});

export const SharedCursorProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentTime, setCurrentTime] = useState<number | null>(null);

  return (
    <SharedCursorContext.Provider value={{ currentTime, setCurrentTime }}>
      {children}
    </SharedCursorContext.Provider>
  );
};

export const useSharedCursor = () => useContext(SharedCursorContext);
