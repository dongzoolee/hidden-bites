import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("HB score hover popover keeps a minimum readable width", async () => {
  const scorePlot = await readFile("components/ScorePlot.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(scorePlot, /className="score-graph-canvas"/);
  assert.match(scorePlot, /className=\{buildTooltipClassName\(tooltip\.x\)\}/);
  assert.match(scorePlot, /function buildTooltipClassName\(x: number\): string/);
  assert.match(scorePlot, /"score-tooltip score-tooltip--left" : "score-tooltip"/);
  assert.match(scorePlot, /<strong>\{tooltip\.score\.displayPlaceName\}<\/strong>/);
  assert.match(scorePlot, /<span>Rank \{tooltip\.rank\}<\/span>/);
  assert.match(scorePlot, /<span>HB score \{tooltip\.score\.chartScore\.toFixed\(2\)\}<\/span>/);
  assert.match(css, /\.score-graph-canvas\s*\{[\s\S]*height: 500px;[\s\S]*position: relative;[\s\S]*width: 100%;[\s\S]*\}/);
  assert.match(css, /\.score-tooltip\s*\{[\s\S]*min-width: 10\.5rem;[\s\S]*width: max-content;[\s\S]*\}/);
  assert.match(css, /\.score-tooltip--left\s*\{[\s\S]*transform: translate\(calc\(-100% - 0\.8rem\), -50%\);[\s\S]*\}/);
  assert.match(css, /\.score-tooltip strong,[\s\S]*\.map-tooltip strong\s*\{[\s\S]*line-height: 1\.25;[\s\S]*overflow-wrap: normal;[\s\S]*\}/);
});
