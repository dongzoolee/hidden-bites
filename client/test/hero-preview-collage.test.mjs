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
  assert.match(
    experience,
    /What are the real factors behind a great\s*<span className="question-card__korean">맛집<\/span>\?/,
  );
  assert.doesNotMatch(experience, /WHAT ARE THE REAL FACTORS/);
  assert.match(experience, /aria-label="Hidden Bites preview collage from Figma"/);
  assert.match(experience, /className="preview-collage__asset"/);
  assert.match(experience, /src="\/figma\/question-preview-collage\.png"/);
  assert.match(experience, /height=\{340\}/);
  assert.match(experience, /width=\{1280\}/);
  assert.match(experience, /alt="Preview collage showing the evaluation card, score badge, score graph, score controls, and Seoul dot map"/);
  assert.doesNotMatch(experience, /preview-report-card|preview-chart-card|preview-controls-card|preview-map-card|preview-score-badge/);
  assert.doesNotMatch(experience, /previewFactors|previewChartDots|previewMapDots/);
  assert.equal(previewAsset.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(previewAsset.readUInt32BE(16), 1280);
  assert.equal(previewAsset.readUInt32BE(20), 340);
  assert.doesNotMatch(experience, /question-preview-collage\.svg/);

  assert.match(css, /\.question-card h2\s*\{[\s\S]*font-family: var\(--font-airbnb-extra-bold\);[\s\S]*font-size: clamp\(3rem, 5\.15vw, 5\.15rem\);[\s\S]*max-width: 68rem;[\s\S]*text-transform: none;/);
  assert.match(css, /\.question-card__korean\s*\{[\s\S]*font-family: "WAGURI", "Noto Sans KR", var\(--font-body\);[\s\S]*font-weight: 800;/);
  assert.match(css, /\.preview-collage\s*\{[\s\S]*margin: clamp\(2\.4rem, 4\.5vw, 4\.2rem\) calc\(var\(--question-card-pad\) \* -1\) calc\(var\(--question-card-pad\) \* -1\);/);
  assert.match(css, /\.preview-collage__asset\s*\{[\s\S]*aspect-ratio: 1280 \/ 340;[\s\S]*display: block;[\s\S]*height: auto;[\s\S]*max-width: none;[\s\S]*width: 110%;/);
  assert.doesNotMatch(css, /question-preview-collage\.svg/);
  assert.doesNotMatch(css, /\.preview-report-card|\.preview-chart-card|\.preview-controls-card|\.preview-map-card|\.preview-score-badge/);
});
