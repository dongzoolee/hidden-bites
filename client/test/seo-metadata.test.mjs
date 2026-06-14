import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("root metadata includes title, description, and Open Graph copy", async () => {
  const layout = await readFile("app/layout.tsx", "utf8");

  assert.match(layout, /metadataBase: siteUrl/);
  assert.match(layout, /title: "Hidden Bites"/);
  assert.match(layout, /description: "Google top 50 Seoul restaurants recalculated by Hidden Bites factor scores\."/);
  assert.match(layout, /openGraph:\s*\{/);
  assert.match(layout, /openGraph:\s*\{[\s\S]*title: "Hidden Bites"/);
  assert.match(layout, /openGraph:\s*\{[\s\S]*description: "Google top 50 Seoul restaurants recalculated by Hidden Bites factor scores\."/);
  assert.match(layout, /siteName: "Hidden Bites"/);
  assert.match(layout, /type: "website"/);
  assert.match(layout, /images: \[socialPreviewImage\]/);
  assert.match(layout, /twitter:\s*\{/);
  assert.match(layout, /card: "summary_large_image"/);
  assert.match(layout, /images: \[socialPreviewImageUrl\]/);
});

test("map route metadata includes title, description, and Open Graph copy", async () => {
  const mapPage = await readFile("app/map/page.tsx", "utf8");

  assert.match(mapPage, /metadataBase: siteUrl/);
  assert.match(mapPage, /title: "Seoul Top 50 Restaurants"/);
  assert.match(mapPage, /description: "Distribution of the top 50 restaurants in Seoul on Kakao Map"/);
  assert.match(mapPage, /openGraph:\s*\{/);
  assert.match(mapPage, /openGraph:\s*\{[\s\S]*title: "Seoul Top 50 Restaurants \| Hidden Bites"/);
  assert.match(mapPage, /openGraph:\s*\{[\s\S]*description: "Explore the Seoul top 50 restaurant distribution on a Kakao Map powered by Hidden Bites location data\."/);
  assert.match(mapPage, /siteName: "Hidden Bites"/);
  assert.match(mapPage, /type: "website"/);
  assert.match(mapPage, /images: \[socialPreviewImage\]/);
  assert.match(mapPage, /twitter:\s*\{/);
  assert.match(mapPage, /card: "summary_large_image"/);
  assert.match(mapPage, /images: \[socialPreviewImageUrl\]/);
});

test("social preview metadata uses the public 1200x630 image asset", async () => {
  const socialPreview = await readFile("lib/social-preview.ts", "utf8");
  const image = await readFile("public/open_graph.png");

  assert.match(socialPreview, /siteUrl = new URL\("https:\/\/hidden-bites\.leed\.at"\)/);
  assert.match(socialPreview, /url: "\/open_graph\.png"/);
  assert.match(socialPreview, /width: 1200/);
  assert.match(socialPreview, /height: 630/);
  assert.match(socialPreview, /alt: "Hidden Bites Seoul restaurant ranking preview"/);
  assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);
});
