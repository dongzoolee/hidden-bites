import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const hbScoreAnswer =
  "HB Score breaks a restaurant's Google reviews into factor-level scores. An NLI model measures how strongly each review relates to factors such as Taste, Service, Wait/Queue, or Cleanliness, then weights the review rating by that relevance and adds a small review-volume reliability bonus.";

test("HB Score QnA answer summarizes the Notion scoring model", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");

  assert.match(experience, /question: "What is the HB Score\?"/);
  assert.ok(experience.includes(`answer: "${hbScoreAnswer}"`));
  assert.match(experience, /NLI model/);
  assert.match(experience, /factor-level scores/);
  assert.match(experience, /review-volume reliability bonus/);
  assert.doesNotMatch(experience, /Adjective and keyword frequencies are extracted from every review per restaurant/);
  assert.doesNotMatch(experience, /leaderboard rearranges/);
});
