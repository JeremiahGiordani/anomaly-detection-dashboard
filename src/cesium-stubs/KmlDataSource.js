// Stub for Cesium's KmlDataSource so zip.js is never needed.
class KmlDataSourceStub {
  static load() {
    throw new Error("KmlDataSource is disabled in this build.");
  }
}
export default KmlDataSourceStub;
export { KmlDataSourceStub as KmlDataSource };
