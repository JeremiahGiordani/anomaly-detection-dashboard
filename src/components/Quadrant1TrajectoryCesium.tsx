// src/components/Quadrant1TrajectoryCesium.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

// Resium (client-only)
const Viewer = dynamic(() => import("resium").then(m => m.Viewer), { ssr: false });
const ImageryLayer = dynamic(() => import("resium").then(m => m.ImageryLayer), { ssr: false });

type CesiumNS = typeof import("cesium");

export default function Quadrant1TrajectoryCesium() {
  const [Cesium, setCesium] = useState<CesiumNS | null>(null);

  // Load Cesium (client only)
  useEffect(() => {
    (async () => {
      const C = await import("cesium");
      // Don’t use Ion at all
      C.Ion.defaultAccessToken = "";
      setCesium(C);
    })();
  }, []);

  // Build providers exactly once after Cesium is available
  const { imageryProvider, terrainProvider } = useMemo(() => {
    if (!Cesium) return { imageryProvider: undefined, terrainProvider: undefined };

    // ---- Option A: OpenStreetMap (recommended first) ----
    const osm = new Cesium.OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/",
      credit: "© OpenStreetMap contributors",
    });
    const imagery = osm;

    // ---- Option B: Esri World Imagery (uncomment to try) ----
    // const imagery = new Cesium.UrlTemplateImageryProvider({
    //   url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    //   credit: "Esri World Imagery",
    //   tilingScheme: new Cesium.WebMercatorTilingScheme(),
    //   maximumLevel: 19,
    // });

    const terrain = new Cesium.EllipsoidTerrainProvider(); // simple, token-free

    return { imageryProvider: imagery, terrainProvider: terrain };
  }, [Cesium]);

  if (!Cesium) return <div className="text-gray-600">Loading globe…</div>;

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
      <Viewer
        /* PASS PROVIDERS AS PROPS to prevent Cesium from adding defaults */
        imageryProvider={imageryProvider as any}
        terrainProvider={terrainProvider as any}
        /* Keep rendering continuous to avoid blank-on-idle */
        style={{ width: "100%", height: "100%" }}
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        infoBox={false}
        selectionIndicator={false}
      >
        {/* Explicit imagery layer for good measure */}
        {imageryProvider && <ImageryLayer imageryProvider={imageryProvider as any} />}
      </Viewer>
    </div>
  );
}
