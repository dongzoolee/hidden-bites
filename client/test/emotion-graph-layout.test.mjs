import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("emotion graph label and bar baseline layout stay aligned", async () => {
  const reportPanel = await readFile("components/RestaurantReportPanel.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(reportPanel, /<span>Emotion Category<\/span>/);
  assert.match(reportPanel, /aria-label="Review emotion category share graph"/);
  assert.match(reportPanel, /<span>Emotion Graph<\/span>/);
  assert.doesNotMatch(reportPanel, /Adjective Graph/);

  assert.match(css, /\.emotion-graph__plot\s*\{[\s\S]*height: 480px;[\s\S]*overflow-x: auto;[\s\S]*overflow-y: hidden;[\s\S]*position: relative;/);
  assert.match(css, /\.emotion-graph__grid\s*\{[\s\S]*bottom: 90px;[\s\S]*grid-template-rows: repeat\(6, 1fr\);/);
  assert.match(css, /\.emotion-graph__bars\s*\{[\s\S]*align-items: start;/);
  assert.match(css, /\.emotion-graph__bars\s*\{[\s\S]*grid-template-columns: repeat\(7, 1fr\);/);
  assert.match(css, /\.emotion-graph__bars\s*\{[\s\S]*min-width: 980px;/);
  assert.match(css, /\.emotion-graph__bars\s*\{[\s\S]*bottom: 0;[\s\S]*top: 0;/);
  assert.match(css, /\.emotion-graph__column\s*\{[\s\S]*grid-template-rows: 325px 28px 21px 20px 34px;/);
  assert.match(css, /\.emotion-graph__bar-wrap\s*\{[\s\S]*height: 325px;/);
  assert.match(reportPanel, /height: `\$\{getGraphPositionPercent\(bucket\.sharePercent, graphMaxPercent\)\}%`/);
  assert.doesNotMatch(reportPanel, /Math\.max\(36/);
  assert.match(reportPanel, /buildMarkerStyle\(bucket\.sharePercent, bucket\.averageSharePercent, graphMaxPercent\)/);
  assert.match(reportPanel, /Math\.max\(barPositionPercent, averagePositionPercent\) \+ graphMarkerGapPercent/);
  assert.match(css, /\.emotion-graph__bar\s*\{[\s\S]*border-radius: 999px 999px 0 0;[\s\S]*width: 76px;[\s\S]*\}/);
  assert.doesNotMatch(css, /\.emotion-graph__bar\s*\{[\s\S]*min-height: 36px;/);
  assert.doesNotMatch(css, /\.emotion-graph__bar\s*\{[\s\S]*padding-top: 14px;/);
  assert.match(css, /\.emotion-graph__bar-value\s*\{[\s\S]*font-family: var\(--font-chart\);[\s\S]*position: absolute;[\s\S]*z-index: 3;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.emotion-graph__bars\s*\{[\s\S]*min-width: 860px;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.emotion-graph__column\s*\{[\s\S]*grid-template-rows: 293\.333px 24px 18px 18px 34px;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.emotion-graph__bar-wrap\s*\{[\s\S]*height: 293\.333px;/);
});
