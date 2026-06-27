import "../components/plasmic/landing_page_starter/plasmic.css"; // plasmic-import: uRya4bPcEVLtpSKZT89NQm/projectcss
import "@/styles/globals.css";
import { PlasmicRootProvider } from "@plasmicapp/react-web";
import type { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <PlasmicRootProvider Head={Head} Link={Link}>
      <Component {...pageProps} />
    </PlasmicRootProvider>
  );
}
