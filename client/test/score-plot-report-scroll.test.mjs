import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("score plot node selection slides down to the selected report section", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const scorePlot = await readFile("components/ScorePlot.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(scorePlot, /export type ScorePlotSelectionOptions = RestaurantSelectionOptions/);
  assert.match(scorePlot, /targetHash: "report"/);
  assert.match(scorePlot, /onSelectPlace\(placeId, \{ scrollToReport: true, targetHash: "report" \}\)/);
  assert.match(scorePlot, /<circle[\s\S]*onClick=\{\(\) => handleReportSelection\(score\.placeId\)\}/);
  assert.match(scorePlot, /onKeyDown=\{\(event\) => \{[\s\S]*handleReportSelection\(score\.placeId\)/);
  assert.match(scorePlot, /hover for the full name · click a dot to inspect it below/);
  assert.match(scorePlot, /aria-label="HB score ranked list"/);
  assert.match(scorePlot, /onClick=\{\(\) => handleReportSelection\(score\.placeId\)\}/);
  assert.match(scorePlot, /function handleGoToReportClick\(\): void/);
  assert.match(scorePlot, /<button className="report-jump" type="button" disabled=\{!selectedScore\} onClick=\{handleGoToReportClick\}>/);
  assert.match(experience, /const reportSectionId = "report"/);
  assert.match(experience, /window\.requestAnimationFrame/);
  assert.match(experience, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
  assert.match(experience, /const nextHash = options\.targetHash \? `#\$\{options\.targetHash\}` : url\.hash/);
  assert.doesNotMatch(css, /\.app-shell\s*\{[^}]*max-width/s);
  assert.doesNotMatch(`${experience}\n${scorePlot}`, /Alert\.alert|as any/);
});
