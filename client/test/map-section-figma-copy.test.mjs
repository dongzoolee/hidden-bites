import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("map story section matches the Figma copy hierarchy", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const seoulMap = await readFile("components/SeoulRestaurantMap.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(experience, /5 — 4 · WHERE ARE THEY LOCATED/);
  assert.match(experience, /aria-label="THE TOP-50 DOTS ACROSS SEOUL\."/);
  assert.match(experience, /THE <span className="map-heading__accent">TOP-50 DOTS<\/span>\s*<br \/>\s*ACROSS SEOUL\./);
  assert.match(
    experience,
    /Most high-review, high-rating restaurants cluster around tourism, shopping, office, and nightlife places:\s*Myeongdong\/Euljiro, Hongdae, Gangnam\/COEX, Seongsu, Itaewon, and Daehakro\./
  );

  assert.match(seoulMap, /className="map-chart-title">Top 50 Restaurant in Seoul<\/h3>/);
  assert.match(seoulMap, /aria-label="Dot Distribution Analysis"/);
  assert.match(seoulMap, /<span>Dot Distribution<\/span>\s*<span>Analysis<\/span>/);
  assert.match(seoulMap, /The top-50 restaurants concentrate in places where visitors search, compare, and review most actively\./);
  assert.match(
    seoulMap,
    /Dense areas — Myeongdong\/Euljiro, Hongdae, Gangnam\/COEX, Seongsu, Itaewon, Daehakro — suggest the "top" list is partly\s*a map of tourism \+ discovery behavior, not only taste quality\./
  );
  assert.match(seoulMap, /n = Google top-50 · ranked by review count × stars · 5-yr window/);
  assert.ok(seoulMap.indexOf("map-source-note") > seoulMap.indexOf("map-note"));

  assert.match(css, /\.story-section--map \.section-kicker\s*\{[\s\S]*color: var\(--yellow\);[\s\S]*margin-bottom: 16px;/);
  assert.match(css, /\.map-heading__accent\s*\{[\s\S]*color: var\(--yellow\);[\s\S]*display: inline;/);
  assert.match(css, /\.map-heading p\s*\{[\s\S]*font-size: 16px;[\s\S]*line-height: 24px;[\s\S]*max-width: 820px;/);
  assert.match(css, /\.map-workspace\s*\{[\s\S]*gap: 28px;[\s\S]*grid-template-columns: minmax\(0, 1\.5fr\) minmax\(20rem, 1fr\);/);
  assert.match(css, /\.map-districts\s*\{[\s\S]*border-radius: 40px;[\s\S]*display: flex;[\s\S]*flex-direction: column;[\s\S]*padding: 40px;/);
  assert.match(css, /\.map-districts h3\s*\{[\s\S]*font-size: 36px;[\s\S]*line-height: 38\.4px;/);
  assert.match(css, /\.map-districts h3 span\s*\{\s*display: block;\s*\}/);
  assert.match(css, /\.map-source-note\s*\{[\s\S]*color: var\(--orange-deep\);[\s\S]*font-family: var\(--font-mono\);[\s\S]*font-size: 11px;[\s\S]*margin-top: auto;/);
});
