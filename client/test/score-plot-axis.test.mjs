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
  assert.match(scorePlot, /const defaultWeightPattern = \[70, 40, 50, 90, 50, 30, 30, 30, 30, 30\]/);
  assert.match(scorePlot, /className="score-control-stack"/);
  assert.match(scorePlot, /className="factor-weight-slider"/);
  assert.match(scorePlot, /scoreMode === "scatter"/);
  assert.match(scorePlot, /scoreMode === "list"/);
  assert.match(scorePlot, /xScaleByRank\(index, weightedScores\.length, plotWidth\)/);
  const scoreControlsStart = scorePlot.indexOf('<section className="score-controls"');
  const scoreControlsEnd = scorePlot.indexOf("</section>", scoreControlsStart);
  const topPickStart = scorePlot.indexOf('<section className="top-pick-card"');

  assert.ok(scoreControlsStart > -1);
  assert.ok(scoreControlsEnd > scoreControlsStart);
  assert.ok(topPickStart > scoreControlsEnd);

  assert.match(css, /\.score-control-stack\s*\{[\s\S]*gap: 20px;[\s\S]*max-width: 400px;/);
  assert.match(css, /\.score-controls/);
  assert.match(css, /\.score-controls\s*\{[\s\S]*background: #1a1310;[\s\S]*border-radius: 32px;[\s\S]*padding: 32px;/);
  assert.match(css, /\.top-pick-card\s*\{[\s\S]*background: #ffc842;[\s\S]*border-radius: 32px;[\s\S]*min-height: 204px;/);
  assert.match(css, /\.factor-weight-slider/);
  assert.match(css, /\.factor-weight-slider::-webkit-slider-thumb\s*\{[\s\S]*background: #ff5a1f;[\s\S]*border: 3px solid var\(--paper\);[\s\S]*height: 22px;/);
  assert.match(css, /\.score-list/);
  assert.match(css, /\.score-mode-toggle \.mini-pill\s*\{\s*background: var\(--paper-soft\);\s*color: var\(--ink\);/);
  assert.match(css, /\.score-mode-toggle \.mini-pill--active\s*\{\s*background: var\(--ink\);\s*color: var\(--paper\);/);
  assert.doesNotMatch(scorePlot, /factor-filter__button/);
  assert.doesNotMatch(scorePlot, />\s*All\s*</);
});
