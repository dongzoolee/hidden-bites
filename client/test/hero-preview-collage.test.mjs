import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("hero and preview match the updated Figma poster collage", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");
  const previewAsset = await readFile("public/figma/question-preview-collage.png");
  const heroMetricRules = [...css.matchAll(/\.hero-metrics > span\s*\{(?<body>[\s\S]*?)\}/g)];
  const heroMetricRule = heroMetricRules.at(-1)?.groups?.body ?? "";
  const heroMetricStrongRule = css.match(/\.hero-metrics strong\s*\{(?<body>[\s\S]*?)\}/)?.groups?.body ?? "";

  assert.match(experience, /Google's top-50 restaurants in Seoul, re-scored by the factors people actually mention in their reviews\./);
  assert.match(experience, /aria-label=\{`\$\{data\.summary\.metadata\.restaurantCount\} restaurants`\}/);
  assert.match(experience, /<strong>\{data\.summary\.metadata\.restaurantCount\}<\/strong>\s*<span>restaurants<\/span>/);
  assert.match(experience, /aria-label="5-yr review window"/);
  assert.match(experience, /<strong>5-yr<\/strong>\s*<span>review window<\/span>/);
  assert.match(experience, /aria-label="NLP adjectives \+ keywords"/);
  assert.match(experience, /<strong>NLP<\/strong>\s*<span>adjectives \+ keywords<\/span>/);
  assert.doesNotMatch(experience, /data\.summary\.metadata\.factorCount\} factors/);
  assert.match(heroMetricRule, /color: var\(--ink\);/);
  assert.match(heroMetricRule, /font-weight: 800;/);
  assert.doesNotMatch(heroMetricRule, /background:/);
  assert.match(heroMetricStrongRule, /color: #FF5A1F;/);
  assert.match(heroMetricStrongRule, /font-weight: 800;/);
  assert.match(experience, /<h2>What are the real factors behind a great 맛집\?<\/h2>/);
  assert.doesNotMatch(experience, /WHAT ARE THE REAL FACTORS/);
  assert.match(experience, /aria-label="Hidden Bites preview collage from Figma"/);
  assert.match(experience, /className="preview-collage__asset"/);
  assert.match(experience, /role="img"/);
  assert.doesNotMatch(experience, /preview-report-card|preview-chart-card|preview-controls-card|preview-map-card|preview-score-badge/);
  assert.doesNotMatch(experience, /previewFactors|previewChartDots|previewMapDots/);
  assert.deepEqual([...previewAsset.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);

  assert.match(css, /\.question-card h2\s*\{[\s\S]*font-family: var\(--font-airbnb-extra-bold\);[\s\S]*max-width: 68rem;[\s\S]*text-transform: none;/);
  assert.match(css, /\.preview-collage\s*\{[\s\S]*margin: clamp\(2\.4rem, 4\.5vw, 4\.2rem\) calc\(var\(--question-card-pad\) \* -1\) calc\(var\(--question-card-pad\) \* -1\);/);
  assert.match(css, /\.preview-collage__asset\s*\{[\s\S]*aspect-ratio: 1104 \/ 336;[\s\S]*background-image: url\("\/figma\/question-preview-collage\.png"\);[\s\S]*background-size: cover;/);
  assert.doesNotMatch(css, /\.preview-report-card|\.preview-chart-card|\.preview-controls-card|\.preview-map-card|\.preview-score-badge/);
});
