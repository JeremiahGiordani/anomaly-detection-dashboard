// src/components/Quadrant1TrajectoryCesium.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSharedCursor } from "./SharedCursorContext";

// Resium (client-only)
const Viewer = dynamic(() => import("resium").then(m => m.Viewer), { ssr: false });
const ImageryLayer = dynamic(() => import("resium").then(m => m.ImageryLayer), { ssr: false });
const Entity = dynamic(() => import("resium").then(m => m.Entity), { ssr: false });
const PolylineGraphics = dynamic(() => import("resium").then(m => m.PolylineGraphics), { ssr: false });
const PointGraphics = dynamic(() => import("resium").then(m => m.PointGraphics), { ssr: false });

type CesiumNS = typeof import("cesium");

interface TrajPt {
  t: number;   // time index
  lat: number; // degrees
  lon: number; // degrees
  alt: number; // feet
}

const FT_TO_M = 0.3048;

export default function Quadrant1TrajectoryCesium() {
  const { currentTime, timeRange, altRange } = useSharedCursor();
  const [Cesium, setCesium] = useState<CesiumNS | null>(null);
  const [traj, setTraj] = useState<TrajPt[]>([]);
  const [viewer, setViewer] = useState<any>(null);
  const didSetInitialView = useRef(false);

  // Load Cesium (client only). We don't use any Ion helpers.
  useEffect(() => {
    (async () => {
      const C = await import("cesium");
      C.Ion.defaultAccessToken = ""; // ensure no token is used
      setCesium(C);
    })();
  }, []);

  // Fetch trajectory
  useEffect(() => {
    fetch("/api/trajectory")
      .then((r) => r.json())
      .then((arr: TrajPt[]) => setTraj(arr))
      .catch(console.error);
  }, []);

  // Imagery & terrain providers passed directly to <Viewer> (prevents Ion defaults)
  const { imageryProvider, terrainProvider } = useMemo(() => {
    if (!Cesium) return { imageryProvider: undefined, terrainProvider: undefined };

    // Option A: OSM (default)
    const imagery = new Cesium.OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/",
      credit: "© OpenStreetMap contributors",
    });

    // Option B: Esri (swap if you prefer)
    // const imagery = new Cesium.UrlTemplateImageryProvider({
    //   url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    //   credit: "Esri World Imagery",
    //   tilingScheme: new Cesium.WebMercatorTilingScheme(),
    //   maximumLevel: 19,
    // });

    const terrain = new Cesium.EllipsoidTerrainProvider();
    return { imageryProvider: imagery, terrainProvider: terrain };
  }, [Cesium]);

  // Apply filters to trajectory
  const filtered = useMemo(() => {
    if (!traj.length) return [];
    return traj.filter((p) => {
      const inTime = !timeRange || (p.t >= timeRange.min && p.t <= timeRange.max);
      const inAlt = !altRange || (p.alt >= altRange.min && p.alt <= altRange.max);
      return inTime && inAlt;
    });
  }, [traj, timeRange, altRange]);

  // Polyline positions
  const positions = useMemo(() => {
    if (!Cesium || !filtered.length) return [];
    return filtered.map((p) =>
      Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt * FT_TO_M)
    );
  }, [Cesium, filtered]);

  // Selected point (from control panel time index)
  const selectedCartesian = useMemo(() => {
    if (!Cesium || currentTime == null || !traj[currentTime]) return null;
    const p = traj[currentTime];
    if (timeRange && (p.t < timeRange.min || p.t > timeRange.max)) return null;
    if (altRange && (p.alt < altRange.min || p.alt > altRange.max)) return null;
    return Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.alt * FT_TO_M);
  }, [Cesium, traj, currentTime, timeRange, altRange]);

  // Set the initial camera view exactly once when positions are available.
  useEffect(() => {
    if (!Cesium || !viewer) return;
    if (didSetInitialView.current) return;

    if (positions.length > 0) {
      const bs = Cesium.BoundingSphere.fromPoints(positions);
      // Set view (no animation) so it doesn't move afterward unless the user does it.
      viewer.camera.setView({ destination: bs.center, orientation: { heading: 0, pitch: -Math.PI / 2, roll: 0 } });
      // Pad out to see the whole path
      viewer.camera.flyToBoundingSphere(bs, { duration: 0.0 });
      didSetInitialView.current = true;
    } else {
      // Fallback to a global view
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-95, 38, 2.2e7),
      });
      didSetInitialView.current = true;
    }
    viewer.scene.requestRender?.();
  }, [Cesium, viewer, positions]);

  if (!Cesium) return <div className="text-gray-600">Loading globe…</div>;

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
      <Viewer
        imageryProvider={imageryProvider as any}
        terrainProvider={terrainProvider as any}
        style={{ width: "100%", height: "100%" }}
        // Keep rendering continuous so imagery appears without interaction
        timeline={false}
        animation={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        infoBox={false}
        selectionIndicator={false}
        onReady={(v: any) => {
          setViewer(v);
          try {
            v.scene.requestRenderMode = false;
            v.scene.globe.show = true;
            v.scene.skyAtmosphere.show = false;
            v.scene.skyBox = undefined;
            v.scene.moon.show = false;
            v.scene.sun.show = false;
            v.scene.fog.enabled = false;
            v.scene.backgroundColor = Cesium.Color.BLACK;
            v.scene.requestRender?.();
          } catch {}
        }}
      >
        {/* Explicit imagery layer (optional redundancy) */}
        {imageryProvider && <ImageryLayer imageryProvider={imageryProvider as any} />}

        {/* Trajectory polyline */}
        {positions.length > 0 && (
          <Entity name="trajectory">
            <PolylineGraphics
              positions={positions}
              width={3}
              // @ts-ignore
              material={Cesium.Color.SKYBLUE}
              followSurface={false}
            />
          </Entity>
        )}

        {/* Selected timepoint marker */}
        {selectedCartesian && (
          <Entity position={selectedCartesian}>
            <PointGraphics
              pixelSize={10}
              // @ts-ignore
              color={Cesium.Color.RED}
            />
          </Entity>
        )}
      </Viewer>
    </div>
  );
}
