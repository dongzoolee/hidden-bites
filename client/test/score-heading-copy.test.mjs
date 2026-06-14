import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("HB Scores prompt keeps the slider callout underlined with an explicit following space", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");

  assert.match(experience, /<u>Drag a slider<\/u>\./);
  assert.match(experience, /<\/strong>\{" "\}\s*The chart recalculates Google&apos;s star points/);
});
