import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("QnA section matches the updated Figma accordion copy and states", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const qnaAccordion = await readFile("components/QnaAccordion.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(qnaAccordion, /export type QnaCardVariant = "default" \| "featured"/);
  assert.doesNotMatch(qnaAccordion, /bodyLines\?: readonly string\[\]/);
  assert.match(qnaAccordion, /meta\?: string/);
  assert.match(qnaAccordion, /export interface QnaFormula/);
  assert.match(qnaAccordion, /formula\?: QnaFormula/);
  assert.match(qnaAccordion, /isOpen \? "A" : "Q"/);
  assert.match(qnaAccordion, /index \+ 1/);
  assert.match(qnaAccordion, /qna-card__meta/);
  assert.doesNotMatch(qnaAccordion, /qna-card__line/);
  assert.match(qnaAccordion, /qna-formula/);
  assert.doesNotMatch(qnaAccordion, /padStart/);

  assert.match(experience, /Before we re-score, the two doubts that come up first — why Google Maps, and how we narrowed the city down to fifty\./);
  assert.match(experience, /Why we chose Google Maps — not Naver or Kakao\./);
  assert.match(experience, /Three Korean review platforms, three trade-offs\. We compared review counts, the presence of star ratings, and how heavily each one skews toward promotional content\./);
  assert.match(experience, /Google Maps/);
  assert.match(experience, /Star ratings, review counts, and a blend of local\/international user insights/);
  assert.doesNotMatch(experience, /bodyLines: \["Star ratings, review counts, and a blend of", "local\/international user insights"\]/);
  assert.match(experience, /Naver Map/);
  assert.ok(experience.includes("High volume of promotional content. Lack of star ratings limits quantitative analysis."));
  assert.ok(!experience.includes('bodyLines: ["\\"High volume of promotional content. Lack", "of star ratings limits quantitative analysis.\\""]'));
  assert.match(experience, /Kakao Map/);
  assert.ok(experience.includes("Insufficient review volume hindered reliable selection of the top 50 list."));
  assert.ok(!experience.includes('bodyLines: ["\\"Insufficient review volume hindered reliable", "selection of the top 50 list.\\""]'));
  assert.doesNotMatch(experience, /stars: ✓ · mix: local \+ tourist|stars: ✕ · ads: high|stars: ✓ · volume: low/);
  assert.match(experience, /How we picked the top 50\./);
  assert.match(experience, /Restaurants were ranked using a weighted sum of two signals over the last five years in Seoul: recency-weighted review volume \+ star-point strength\. The top-50 candidates then enter the recalculation pipeline\./);
  assert.match(experience, /label: "Formula"/);
  assert.ok(experience.includes("score(rₖ) = 0.55 · log(reviews_5y) + 0.45 · stars · √reviews_30d"));
  assert.match(experience, /What is the HB Score\?/);
  assert.match(experience, /HB Score breaks a restaurant's Google reviews into factor-level scores\. An NLI model measures how strongly each review relates to factors such as Taste, Service, Wait\/Queue, or Cleanliness, then weights the review rating by that relevance and adds a small review-volume reliability bonus\./);
  assert.doesNotMatch(experience, /Adjective and keyword frequencies are extracted from every review per restaurant/);
  assert.doesNotMatch(experience, /Move a slider — the leaderboard rearranges/);
  assert.doesNotMatch(experience, /Before we re-score anything/);
  assert.doesNotMatch(experience, /Score = star rating, review count, five-year review window, and Seoul-only location filter/);
  assert.doesNotMatch(experience, /HB Score re-weights restaurant reviews by factor-level evidence extracted from review text/);
  assert.doesNotMatch(experience, /별점 \+ 리뷰 수|광고성 리뷰 과다|리뷰 수가 부족해/);

  assert.match(css, /\.split-heading\s*\{[\s\S]*display: grid;[\s\S]*gap: 1\.25rem;[\s\S]*grid-template-columns: minmax\(0, 1fr\);[\s\S]*max-width: min\(100%, 62rem\);/);
  assert.doesNotMatch(css, /\.split-heading\s*\{[\s\S]*grid-template-columns: minmax\(0, 0\.85fr\) minmax\(20rem, 0\.65fr\);/);
  assert.match(css, /\.qna__item\s*\{[\s\S]*border: 0;[\s\S]*border-radius: 1\.55rem;/);
  assert.match(css, /\.story-section--qna \.qna\s*\{[\s\S]*margin-left: 0;[\s\S]*margin-right: 0;/);
  assert.doesNotMatch(css, /\.story-section--qna \.qna\s*\{[\s\S]*margin-left: calc\(clamp\(2rem, 6vw, 5\.5rem\) \* -1\);[\s\S]*margin-right: calc\(clamp\(2rem, 6vw, 5\.5rem\) \* -1\);/);
  assert.match(css, /\.qna__number\s*\{[\s\S]*height: 2\.65rem;[\s\S]*width: 2\.65rem;/);
  assert.match(css, /\.qna-card--featured\s*\{[\s\S]*background: var\(--ink\);[\s\S]*color: var\(--paper\);/);
  assert.match(css, /\.qna-card\s*\{[\s\S]*background: #ffe4a3;[\s\S]*border-radius: clamp\(1\.4rem, 1\.56vw, 2rem\);[\s\S]*gap: clamp\(1\.2rem, 1\.25vw, 1\.6rem\);[\s\S]*min-height: clamp\(9\.25rem, 10\.3vw, 13\.15rem\);[\s\S]*min-width: 0;/);
  assert.match(css, /\.qna-card strong\s*\{[\s\S]*font-size: clamp\(1\.75rem, 2\.05vw, 2\.6rem\);[\s\S]*font-weight: 800;/);
  assert.match(css, /\.qna-card strong::before\s*\{[\s\S]*background: var\(--yellow\);[\s\S]*border-radius: 50%;[\s\S]*content: "";/);
  assert.match(css, /\.qna-card p\s*\{[\s\S]*font-family: "Airbnb Cereal", var\(--font-body\);[\s\S]*font-size: clamp\(1rem, 1\.125vw, 1\.4375rem\);[\s\S]*line-height: 1\.46;[\s\S]*max-width: 100%;[\s\S]*min-width: 0;[\s\S]*overflow-wrap: anywhere;/);
  assert.doesNotMatch(css, /\.qna-card__line/);
  assert.match(css, /\.qna-card--featured p\s*\{[\s\S]*color: #e9dcc8;/);
  assert.match(css, /\.qna-card__meta\s*\{[\s\S]*font-family: var\(--font-mono\);/);
  assert.match(css, /\.qna__answer\s*\{[\s\S]*--qna-answer-content-offset: 4\.5rem;/);
  assert.match(css, /\.qna__answer > p\s*\{[\s\S]*margin: 0 0 0 var\(--qna-answer-content-offset\);/);
  assert.match(css, /\.qna-formula\s*\{[\s\S]*background: #fff1da;[\s\S]*border-radius: 20px;[\s\S]*gap: 6px;[\s\S]*margin-left: var\(--qna-answer-content-offset\);[\s\S]*max-width: min\(calc\(100% - var\(--qna-answer-content-offset\)\), 42\.4375rem\);[\s\S]*padding: 18px 20px;[\s\S]*width: fit-content;/);
  assert.match(css, /\.qna-formula span\s*\{[\s\S]*color: #949494;[\s\S]*font-family: var\(--font-mono\);[\s\S]*font-size: 1rem;[\s\S]*font-weight: 400;[\s\S]*letter-spacing: 0\.44px;[\s\S]*line-height: 1\.3125;/);
  assert.match(css, /\.qna-formula code\s*\{[\s\S]*color: #8b2415;[\s\S]*font-family: var\(--font-mono\);[\s\S]*font-size: 1rem;[\s\S]*font-weight: 700;[\s\S]*letter-spacing: 0\.44px;[\s\S]*line-height: 1\.3125;[\s\S]*overflow-wrap: normal;[\s\S]*white-space: nowrap;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.qna__number\s*\{[\s\S]*height: 2\.25rem;[\s\S]*width: 2\.25rem;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.story-section--qna \.qna\s*\{[\s\S]*margin-left: 0;[\s\S]*margin-right: 0;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.qna__answer\s*\{[\s\S]*--qna-answer-content-offset: 0;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.qna-card strong\s*\{[\s\S]*font-size: 1\.55rem;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.qna-formula\s*\{[\s\S]*margin-left: 0;[\s\S]*max-width: 100%;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.qna-formula code\s*\{[\s\S]*overflow-wrap: anywhere;[\s\S]*white-space: normal;/);
});

test("QnA platform card descriptions do not use manual line breaks", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const qnaAccordion = await readFile("components/QnaAccordion.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.doesNotMatch(qnaAccordion, /bodyLines/);
  assert.doesNotMatch(qnaAccordion, /qna-card__line/);
  assert.doesNotMatch(css, /qna-card__line/);
  assert.match(experience, /body: "\\"High volume of promotional content\. Lack of star ratings limits quantitative analysis\.\\""/);
  assert.match(experience, /body: "\\"Insufficient review volume hindered reliable selection of the top 50 list\.\\""/);
  assert.doesNotMatch(experience, /bodyLines: \["\\"High volume of promotional content\. Lack"/);
  assert.doesNotMatch(experience, /bodyLines: \["\\"Insufficient review volume hindered reliable"/);
});
