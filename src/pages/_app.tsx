import type { AppProps } from "next/app";
import "../styles/globals.css";
import "cesium/Build/Cesium/Widgets/widgets.css"; // <-- Cesium UI styles

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
