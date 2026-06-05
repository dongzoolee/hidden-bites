import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("QnA section matches the updated Figma accordion copy and states", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const qnaAccordion = await readFile("components/QnaAccordion.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(qnaAccordion, /export type QnaCardVariant = "default" \| "featured"/);
  assert.match(qnaAccordion, /meta\?: string/);
  assert.match(qnaAccordion, /export interface QnaFormula/);
  assert.match(qnaAccordion, /formula\?: QnaFormula/);
  assert.match(qnaAccordion, /isOpen \? "A" : "Q"/);
  assert.match(qnaAccordion, /index \+ 1/);
  assert.match(qnaAccordion, /qna-card__meta/);
  assert.match(qnaAccordion, /qna-formula/);
  assert.doesNotMatch(qnaAccordion, /padStart/);

  assert.match(experience, /Before we re-score, the two doubts that come up first — why Google Maps, and how we narrowed the city down to fifty\./);
  assert.match(experience, /Why we chose Google Maps — not Naver or Kakao\./);
  assert.match(experience, /Three Korean review platforms, three trade-offs\. We compared review counts, the presence of star ratings, and how heavily each one skews toward promotional content\./);
  assert.match(experience, /Google Maps/);
  assert.match(experience, /stars: ✓ · mix: local \+ tourist/);
  assert.match(experience, /별점 \+ 리뷰 수 \+ 외국인·현지인이 혼재한 더 중립적인 데이터\./);
  assert.match(experience, /Naver Map/);
  assert.match(experience, /stars: ✕ · ads: high/);
  assert.match(experience, /광고성 리뷰 과다\. 별점이 없어 정량 비교가 어렵다\./);
  assert.match(experience, /Kakao Map/);
  assert.match(experience, /stars: ✓ · volume: low/);
  assert.match(experience, /리뷰 수가 부족해 상위 50개를 안정적으로 추리기 어려웠다\./);
  assert.match(experience, /How we picked the top 50\./);
  assert.match(experience, /Restaurants were ranked using a weighted sum of two signals over the last five years in Seoul: recency-weighted review volume \+ star-point strength\. The top-50 candidates then enter the recalculation pipeline\./);
  assert.match(experience, /label: "Formula"/);
  assert.ok(experience.includes("score(r_k) = 0.55 · log(reviews_5y) + 0.45 · stars · sqrt(reviews_30d)"));
  assert.match(experience, /What is the HB Score\?/);
  assert.match(experience, /Adjective and keyword frequencies are extracted from every review per restaurant\. You decide which factors matter, set their weights, and the page re-scores all 50 against your preferences\. Move a slider — the leaderboard rearranges\./);
  assert.doesNotMatch(experience, /Before we re-score anything/);
  assert.doesNotMatch(experience, /Score = star rating, review count, five-year review window, and Seoul-only location filter/);
  assert.doesNotMatch(experience, /HB Score re-weights restaurant reviews by factor-level evidence extracted from review text/);

  assert.match(css, /\.qna__item\s*\{[\s\S]*border: 0;[\s\S]*border-radius: 1\.55rem;/);
  assert.match(css, /\.qna__number\s*\{[\s\S]*height: 2\.65rem;[\s\S]*width: 2\.65rem;/);
  assert.match(css, /\.qna-card--featured\s*\{[\s\S]*background: var\(--ink\);[\s\S]*color: var\(--paper\);/);
  assert.match(css, /\.qna-card__meta\s*\{[\s\S]*font-family: var\(--font-mono\);/);
  assert.match(css, /\.qna-formula\s*\{[\s\S]*background: var\(--paper-soft\);[\s\S]*border-radius: 999px;/);
  assert.match(css, /\.qna-formula code\s*\{[\s\S]*overflow-wrap: anywhere;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.qna__number\s*\{[\s\S]*height: 2\.25rem;[\s\S]*width: 2\.25rem;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.qna-formula\s*\{[\s\S]*max-width: 100%;/);
});
