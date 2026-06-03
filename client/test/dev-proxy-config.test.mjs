import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("dev Next config proxies API traffic to the local backend", async () => {
  const nextConfig = await readFile("next.config.ts", "utf8");

  assert.match(nextConfig, /process\.env\.NODE_ENV === "development"/);
  assert.match(nextConfig, /process\.env\.HIDDEN_BITES_API_PROXY_TARGET \?\? "http:\/\/127\.0\.0\.1:8097"/);
  assert.match(nextConfig, /skipTrailingSlashRedirect: isDevelopment/);
  assert.match(nextConfig, /async rewrites\(\)/);
  assert.match(nextConfig, /source: "\/api\/:path\*"/);
  assert.match(nextConfig, /destination: `\$\{apiProxyTarget\}\/api\/:path\*`/);
  assert.match(nextConfig, /source: "\/health"/);
  assert.match(nextConfig, /destination: `\$\{apiProxyTarget\}\/health`/);
  assert.doesNotMatch(nextConfig, /8086/);
});
