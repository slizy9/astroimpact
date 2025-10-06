// Import global styles
import '../globals.css'; // Ensure your tsconfig.json includes "resolveJsonModule": true and "moduleResolution": "node"
import Script from 'next/script';
import type { AppProps } from 'next/app';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
  <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      <Component {...pageProps} />
    </>
  );
}
