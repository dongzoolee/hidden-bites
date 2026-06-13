import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("root metadata includes title, description, and Open Graph copy", async () => {
  const layout = await readFile("app/layout.tsx", "utf8");

  assert.match(layout, /title: "Hidden Bites"/);
  assert.match(layout, /description: "Google top 50 Seoul restaurants recalculated by Hidden Bites factor scores\."/);
  assert.match(layout, /openGraph:\s*\{/);
  assert.match(layout, /openGraph:\s*\{[\s\S]*title: "Hidden Bites"/);
  assert.match(layout, /openGraph:\s*\{[\s\S]*description: "Google top 50 Seoul restaurants recalculated by Hidden Bites factor scores\."/);
  assert.match(layout, /siteName: "Hidden Bites"/);
  assert.match(layout, /type: "website"/);
});

test("map route metadata includes title, description, and Open Graph copy", async () => {
  const mapPage = await readFile("app/map/page.tsx", "utf8");

  assert.match(mapPage, /title: "Seoul Top 50 Restaurants"/);
  assert.match(mapPage, /description: "Distribution of the top 50 restaurants in Seoul on Kakao Map"/);
  assert.match(mapPage, /openGraph:\s*\{/);
  assert.match(mapPage, /openGraph:\s*\{[\s\S]*title: "Seoul Top 50 Restaurants \| Hidden Bites"/);
  assert.match(mapPage, /openGraph:\s*\{[\s\S]*description: "Explore the Seoul top 50 restaurant distribution on a Kakao Map powered by Hidden Bites location data\."/);
  assert.match(mapPage, /siteName: "Hidden Bites"/);
  assert.match(mapPage, /type: "website"/);
});
