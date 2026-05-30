import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("client implements the required story surfaces", async () => {
  const page = await readFile("app/page.tsx", "utf8");
  const layout = await readFile("app/layout.tsx", "utf8");
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const scorePlot = await readFile("components/ScorePlot.tsx", "utf8");
  const reportPanel = await readFile("components/RestaurantReportPanel.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(page, /HiddenBitesExperience/);
  assert.match(experience, /QnaAccordion/);
  assert.match(experience, /ScorePlot/);
  assert.match(experience, /RestaurantReportPanel/);
  assert.match(scorePlot, /role="button"/);
  assert.match(reportPanel, /keyword-chip/);
  assert.match(css, /100svh/);
  assert.match(css, /--font-primary: "Airbnb Cereal"/);
  assert.match(css, /a0\.muscache\.com\/airbnb\/static\/airbnb-dls-web\/build\/fonts\/cereal-variable\/AirbnbCerealVF_W_Wght/);
  assert.match(layout, /rel="preconnect"/);
  assert.match(layout, /https:\/\/a0\.muscache\.com/);
  assert.doesNotMatch(css, /Georgia|"Courier New"/);
  assert.doesNotMatch(experience, /Loading Hidden Bites data story/);
  assert.doesNotMatch(`${experience}\n${scorePlot}\n${reportPanel}`, /Alert\.alert|as any/);
});
