import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("score plot exposes weighted controls and ranks restaurants across the x-axis", async () => {
  const scorePlot = await readFile("components/ScorePlot.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(scorePlot, /export type ScoreMode = "scatter" \| "list"/);
  assert.match(scorePlot, /interface FactorWeight/);
  assert.match(scorePlot, /buildWeightedScores/);
  assert.match(scorePlot, /right\.weightedScore - left\.weightedScore/);
  assert.match(scorePlot, /className="factor-weight-slider"/);
  assert.match(scorePlot, /scoreMode === "scatter"/);
  assert.match(scorePlot, /scoreMode === "list"/);
  assert.match(scorePlot, /xScaleByRank\(index, weightedScores\.length, plotWidth\)/);
  assert.match(css, /\.score-controls/);
  assert.match(css, /\.factor-weight-slider/);
  assert.match(css, /\.score-list/);
  assert.match(css, /\.score-mode-toggle \.mini-pill\s*\{\s*background: var\(--paper-soft\);\s*color: var\(--ink\);/);
  assert.match(css, /\.score-mode-toggle \.mini-pill--active\s*\{\s*background: var\(--ink\);\s*color: var\(--paper\);/);
  assert.doesNotMatch(scorePlot, /factor-filter__button/);
  assert.doesNotMatch(scorePlot, />\s*All\s*</);
});
