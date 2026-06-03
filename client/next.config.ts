import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";
const apiProxyTarget = process.env.HIDDEN_BITES_API_PROXY_TARGET ?? "http://127.0.0.1:8097";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  skipTrailingSlashRedirect: isDevelopment,
  ...(isDevelopment
    ? {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${apiProxyTarget}/api/:path*`
            },
            {
              source: "/health",
              destination: `${apiProxyTarget}/health`
            }
          ];
        }
      }
    : {})
};

export default nextConfig;
