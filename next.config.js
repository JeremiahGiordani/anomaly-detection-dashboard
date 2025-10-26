/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    const webpack = require("webpack");

    // Let Cesium know where to find its runtime assets (we copy them to /public/cesium)
    config.plugins.push(
      new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify("/cesium"),
      })
    );

    // -------- Hard replace modules that drag in zip.js ----------
    const stubKml = path.resolve(__dirname, "src/cesium-stubs/KmlDataSource.js");
    const stubZip = path.resolve(__dirname, "src/cesium-stubs/zip-no-worker.js");

    // Replace ANY variant of KmlDataSource import with our stub
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /(@cesium\/engine\/Source\/DataSources\/KmlDataSource(\.js)?|cesium\/Source\/DataSources\/KmlDataSource(\.js)?)/,
        stubKml
      )
    );

    // Replace ANY variant of zip-no-worker with a no-op stub
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /@zip\.js\/zip\.js\/(lib|dist)\/zip-no-worker(\.min)?\.js/,
        stubZip
      )
    );

    // Optional: keep any previous aliases you have (not required for this fix)
    // config.resolve.alias = { ...(config.resolve.alias || {}) };

    return config;
  },
};

module.exports = nextConfig;
