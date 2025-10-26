// Copies the full Cesium build (including Workers) into /public/cesium.
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");

(async () => {
  try {
    const src = path.join(process.cwd(), "node_modules", "cesium", "Build", "Cesium");
    const dest = path.join(process.cwd(), "public", "cesium");

    if (!fs.existsSync(src)) {
      console.error("[copy-cesium] Cesium build directory not found:", src);
      process.exit(0);
    }

    await fse.remove(dest);           // wipe old
    await fse.ensureDir(dest);
    // IMPORTANT: copy EVERYTHING (Workers/*.js must be included)
    await fse.copy(src, dest, { overwrite: true });

    console.log("[copy-cesium] Copied Cesium assets to", dest);
  } catch (e) {
    console.error("[copy-cesium] Failed to copy assets:", e);
    process.exit(1);
  }
})();
