import type { Metadata } from "next";
import "../src/styles.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    "https://veridoc-react-portal.bakareferanmi96.chatgpt.site",
  ),
  title: "VeriDoc · Identity, credentials & opportunity",
  description: "Identity, credential verification and evidence-based trust.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "VeriDoc",
    title: "VeriDoc · Identity, credentials & opportunity",
    description: "Identity, credential verification and evidence-based trust.",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VeriDoc. Verify a credential.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VeriDoc",
    description: "Identity, credentials and evidence-based trust.",
    images: ["/og-image.png"],
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Public+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#14213D" />
      </head>
      <body>{children}</body>
    </html>
  );
}
