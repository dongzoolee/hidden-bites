import type { Metadata } from "next";
import { siteUrl, socialPreviewImage, socialPreviewImageUrl } from "@/lib/social-preview";
import "@/app/globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Hidden Bites",
  description: "Google top 50 Seoul restaurants recalculated by Hidden Bites factor scores.",
  openGraph: {
    title: "Hidden Bites",
    description: "Google top 50 Seoul restaurants recalculated by Hidden Bites factor scores.",
    siteName: "Hidden Bites",
    type: "website",
    locale: "en_US",
    images: [socialPreviewImage]
  },
  twitter: {
    card: "summary_large_image",
    title: "Hidden Bites",
    description: "Google top 50 Seoul restaurants recalculated by Hidden Bites factor scores.",
    images: [socialPreviewImageUrl]
  },
  icons: {
    icon: [{ url: "/favicon.png", sizes: "64x64", type: "image/png" }],
    shortcut: [{ url: "/favicon.png", type: "image/png" }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://a0.muscache.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Inter:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Sora:wght@400;600;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
