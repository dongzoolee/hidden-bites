import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("score plot matches the Figma HB score graph contract", async () => {
  const scorePlot = await readFile("components/ScorePlot.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(scorePlot, /export type ScoreMode = "scatter" \| "list"/);
  assert.match(scorePlot, /interface PlotRestaurantScore/);
  assert.match(scorePlot, /const chart = \{\s*width: 784,[\s\S]*height: 500,[\s\S]*left: 35,[\s\S]*top: 39,[\s\S]*plotWidth: 736,[\s\S]*plotHeight: 409/);
  assert.match(scorePlot, /const chartScoreDomain: NumericDomain = \{\s*min: 4\.83,[\s\S]*max: 4\.96/);
  assert.match(scorePlot, /const xTickValues = \[0, 25, 50, 75, 100\]/);
  assert.match(scorePlot, /const yTickLabels = \["4\.96", "4\.93", "4\.90", "4\.87", "4\.83"\]/);
  assert.match(scorePlot, /className="score-graph-card"/);
  assert.match(scorePlot, /className="score-axis-selector"/);
  assert.match(scorePlot, /x: \{selectedFactor\?\.label \?\? "Taste"\} →/);
  assert.match(scorePlot, /className="score-graph-plot"/);
  assert.match(scorePlot, /className="score-top-callout"/);
  assert.match(scorePlot, /className="score-ranked-list"/);
  assert.match(scorePlot, /buildPlotScores/);
  assert.match(scorePlot, /buildFactorIndex/);
  assert.match(scorePlot, /scaleToDomain/);
  assert.match(scorePlot, /scoreMode === "scatter"/);
  assert.match(scorePlot, /scoreMode === "list"/);
  assert.doesNotMatch(scorePlot, /FactorWeight|defaultWeightPattern|factor-weight-slider|score-control-stack|score-controls/);
  assert.doesNotMatch(scorePlot, />\s*All\s*</);

  assert.match(css, /\.score-lab\s*\{[\s\S]*display: block;[\s\S]*max-width: 856px;/);
  assert.match(css, /\.score-graph-card\s*\{[\s\S]*background: #fff7e9;[\s\S]*border-radius: 36px;[\s\S]*padding: 36px 36px 51px;/);
  assert.match(css, /\.score-toolbar\s*\{[\s\S]*gap: 8px;[\s\S]*margin-bottom: 32px;/);
  assert.match(css, /\.score-mode-button\s*\{[\s\S]*border: 2px solid #1a1310;[\s\S]*border-radius: 999px;[\s\S]*font-size: 13px;[\s\S]*min-height: 38px;/);
  assert.match(css, /\.score-mode-button--active\s*\{[\s\S]*background: #1a1310;[\s\S]*color: #fff1da;/);
  assert.match(css, /\.score-axis-selector\s*\{[\s\S]*color: #8b2415;[\s\S]*font-family: var\(--font-display\);[\s\S]*letter-spacing: 0\.56px;/);
  assert.match(css, /\.score-graph-content h3\s*\{[\s\S]*color: #8b2415;[\s\S]*font-family: var\(--font-display\);[\s\S]*font-size: 18px;[\s\S]*letter-spacing: 0\.56px;/);
  assert.match(css, /\.score-graph-plot,[\s\S]*\.score-ranked-list\s*\{[\s\S]*height: 500px;[\s\S]*position: relative;/);
  assert.match(css, /\.score-grid-line\s*\{[\s\S]*stroke: rgba\(26, 19, 16, 0\.08\);/);
  assert.match(css, /\.score-axis-line\s*\{[\s\S]*stroke: #1a1310;[\s\S]*stroke-width: 2\.4;/);
  assert.match(css, /\.score-axis-label\s*\{[\s\S]*fill: #8b2415;[\s\S]*font-family: var\(--font-chart\);[\s\S]*font-size: 10px;/);
  assert.match(css, /\.score-dot--top-pick\s*\{[\s\S]*fill: #ff5a1f;[\s\S]*stroke: #1a1310;/);
  assert.match(css, /\.score-top-callout\s*\{[\s\S]*background: #ffc842;[\s\S]*border-radius: 999px;[\s\S]*min-height: 30px;/);
  assert.match(css, /\.score-top-callout::after\s*\{[\s\S]*border-top: 18px solid #ffc842;/);
  assert.match(css, /\.score-graph-instructions\s*\{[\s\S]*font-family: var\(--font-mono\);[\s\S]*font-size: 12px;[\s\S]*text-align: right;/);
  assert.doesNotMatch(css, /\.factor-weight-slider|\.score-control-stack|\.score-controls/);
});
