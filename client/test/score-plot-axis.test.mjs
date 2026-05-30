import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("score plot uses one selected factor and ranks restaurants across the x-axis", async () => {
  const scorePlot = await readFile("components/ScorePlot.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(scorePlot, /aria-label="X-axis factor"/);
  assert.match(scorePlot, /selectedFactorPoints/);
  assert.match(scorePlot, /right\.hbScore - left\.hbScore/);
  assert.match(scorePlot, /xScaleByRank\(index, selectedFactorPoints\.length, plotWidth\)/);
  assert.match(css, /\.factor-select/);
  assert.match(css, /\.rank-line/);
  assert.doesNotMatch(scorePlot, /factor-filter__button/);
  assert.doesNotMatch(scorePlot, />\s*All\s*</);
});
