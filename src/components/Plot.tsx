"use client";
import dynamic from "next/dynamic";

// Load Plotly only on the client to avoid "self is not defined" during SSR
const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

export default Plot;
