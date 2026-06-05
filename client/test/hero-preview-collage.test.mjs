import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("hero and preview match the updated Figma poster collage", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(experience, /Google's top-50 restaurants in Seoul, re-scored by the factors people actually mention in their reviews\./);
  assert.match(experience, /NLP adjectives \+ keywords/);
  assert.doesNotMatch(experience, /data\.summary\.metadata\.factorCount\} factors/);
  assert.match(css, /\.hero-metrics span\s*\{[\s\S]*background: #FF5A1F;[\s\S]*font-weight: 800;/);
  assert.match(experience, /aria-label="Hidden Bites preview collage"/);
  assert.match(experience, /preview-report-card/);
  assert.match(experience, /preview-chart-card/);
  assert.match(experience, /preview-controls-card/);
  assert.match(experience, /preview-map-card/);
  assert.match(experience, /preview-score-badge/);
  assert.match(experience, /Mutan COEX Store/);
  assert.match(experience, /Jongno Naengmyeon/);
  assert.match(experience, /74\.0/);
  assert.match(experience, /previewFactors\.map/);
  assert.match(experience, /previewChartDots\.map/);
  assert.match(experience, /previewMapDots\.map/);
  assert.doesNotMatch(experience, /preview-card--dark|preview-card--chart|preview-card--map|COEX Store<\/span>|HB Score graph<\/span>|Seoul dots<\/span>/);

  assert.match(css, /\.preview-collage\s*\{[\s\S]*isolation: isolate;[\s\S]*position: relative;/);
  assert.match(css, /\.preview-report-card,[\s\S]*\.preview-score-badge\s*\{[\s\S]*position: absolute;/);
  assert.match(css, /\.preview-report-card\s*\{[\s\S]*transform: rotate\(-5\.5deg\);/);
  assert.match(css, /\.preview-chart-card\s*\{[\s\S]*transform: rotate\(6\.5deg\);/);
  assert.match(css, /\.preview-controls-card\s*\{[\s\S]*background: var\(--ink\);/);
  assert.match(css, /\.preview-map-card\s*\{[\s\S]*transform: rotate\(10deg\);/);
  assert.match(css, /\.preview-score-badge\s*\{[\s\S]*background: var\(--yellow\);/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.preview-report-card,[\s\S]*\.preview-score-badge\s*\{[\s\S]*position: static;[\s\S]*transform: none;/);
});
