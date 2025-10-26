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
  const didFlyHome = useRef(false);

  // Load Cesium (client only). We don't use Ion helpers.
  useEffect(() => {
    (async () => {
      const C = await import("cesium");
      C.Ion.defaultAccessToken = ""; // ensure no Ion token
      setCesium(C);
    })();
  }, []);

  // Fetch trajectory (mock API)
  useEffect(() => {
    fetch("/api/trajectory")
      .then((r) => r.json())
      .then((arr: TrajPt[]) => setTraj(arr))
      .catch(console.error);
  }, []);

  // Providers passed directly to Viewer (prevents defaults)
  const { imageryProvider, terrainProvider } = useMemo(() => {
    if (!Cesium) return { imageryProvider: undefined, terrainProvider: undefined };
    const imagery = new Cesium.OpenStreetMapImageryProvider({
      url: "https://tile.openstreetmap.org/",
      credit: "© OpenStreetMap contributors",
    });
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

  // --- Compute a HOME rectangle from trajectory extents (with padding) ---
  const homeRectangle = useMemo(() => {
    if (!Cesium) return null;
    const src = filtered.length ? filtered : traj;
    if (!src.length) return null;

    // Lat bounds
    let minLat = Infinity, maxLat = -Infinity;
    for (const p of src) {
      if (p.lat < minLat) minLat = p.lat;
      if (p.lat > maxLat) maxLat = p.lat;
    }
    // Lon bounds – handle anti-meridian robustly
    const lons = src.map(p => {
      // normalize to [-180, 180]
      let lon = p.lon;
      while (lon <= -180) lon += 360;
      while (lon > 180) lon -= 360;
      return lon;
    });
    let minLon = Math.min(...lons);
    let maxLon = Math.max(...lons);
    // If span > 180, re-map to [0,360) to avoid crossing
    if (maxLon - minLon > 180) {
      const lons360 = lons.map(l => (l < 0 ? l + 360 : l));
      minLon = Math.min(...lons360);
      maxLon = Math.max(...lons360);
      // map back to [-180,180] domain
      minLon = (minLon > 180 ? minLon - 360 : minLon);
      maxLon = (maxLon > 180 ? maxLon - 360 : maxLon);
      if (minLon > maxLon) [minLon, maxLon] = [maxLon, minLon];
    }

    // Padding (min 0.05°) – about ~5–10 km depending on lat
    const latPad = Math.max(0.05, (maxLat - minLat) * 0.15);
    const lonPad = Math.max(0.05, (maxLon - minLon) * 0.15);

    const west  = Math.max(-180, minLon - lonPad);
    const east  = Math.min( 180, maxLon + lonPad);
    const south = Math.max( -90, minLat - latPad);
    const north = Math.min(  90, maxLat + latPad);

    return Cesium.Rectangle.fromDegrees(west, south, east, north);
  }, [Cesium, filtered, traj]);

  // Fly once to the HOME rectangle on first availability
  useEffect(() => {
    if (!Cesium || !viewer || didFlyHome.current) return;
    if (!homeRectangle) return;

    try {
      viewer.camera.flyTo({
        destination: homeRectangle,
        duration: 2.0,
      });
      didFlyHome.current = true;
      viewer.scene.requestRender?.();
    } catch {
      // ignore
    }
  }, [Cesium, viewer, homeRectangle]);

  if (!Cesium) return <div className="text-gray-600">Loading globe…</div>;

  return (
    <div style={{ width: "100%", height: "100%", minHeight: 0 }}>
      <Viewer
        imageryProvider={imageryProvider as any}
        terrainProvider={terrainProvider as any}
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
        onReady={(v: any) => {
          setViewer(v);
          try {
            v.scene.requestRenderMode = false; // continuous render
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

        {/* Selected point */}
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
