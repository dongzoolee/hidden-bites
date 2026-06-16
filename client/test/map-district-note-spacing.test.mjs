import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("map district rows keep space before the dense-area note", async () => {
  const seoulMap = await readFile("components/SeoulRestaurantMap.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.ok(seoulMap.indexOf('className="map-district-list"') < seoulMap.indexOf('className="map-note"'));
  assert.match(css, /\.map-note\s*\{[\s\S]*margin-top: 48px;/);
});
