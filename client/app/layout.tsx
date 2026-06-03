import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Hidden Bites",
  description: "Google top 50 Seoul restaurants recalculated by Hidden Bites factor scores."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="preconnect" href="https://a0.muscache.com" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
