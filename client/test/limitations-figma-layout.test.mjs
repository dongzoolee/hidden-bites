import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("limitations section matches the Figma card layout and copy breaks", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(
    experience,
    /<p className="limitations-copy">\s*<span>Five honest disclaimers\.<\/span>\s*<span>Every visualization above sits inside the boundaries described below\.<\/span>\s*<\/p>/,
  );
  assert.match(experience, /titleLines: \["Rating", "inflation"\]/);
  assert.match(experience, /titleLines: \["Time", "sensitivity"\]/);
  assert.match(experience, /bodyLines: \["We analyzed top-50 only\.", "Seoul has thousands of", "restaurants — an entire", "long tail of small, beloved", "places sits outside our", "sample\."\]/);
  assert.match(experience, /bodyLines: \["Google Maps reviewers are", "not a neutral sample\.", "Tourist languages are", "overrepresented; Korean", "local voices are under-", "weighted\."\]/);
  assert.match(experience, /bodyLines: \["Restaurant quality", "changes over time\. Our", "dataset reflects a single", "crawl point — chefs leave,", "prices rise, lines move\."\]/);
  assert.match(experience, /className="limitation-card__number"/);
  assert.match(experience, /className="limitation-card__title"/);
  assert.match(experience, /className="limitation-card__body"/);
  assert.doesNotMatch(experience, /top-50, high-review Seoul restaurants|Tourist-heavy locations|A five-year review window still contains old signals/);

  assert.match(css, /\.story-section--limitations\s*\{[\s\S]*background: #fff7e9;[\s\S]*padding: 100px 80px 120px;/);
  assert.match(css, /\.story-section--limitations h2\s*\{[\s\S]*font-size: clamp\(4\.5rem, 6\.67vw, 6rem\);[\s\S]*letter-spacing: -0\.01em;[\s\S]*line-height: 0\.98;[\s\S]*max-width: 68\.75rem;/);
  assert.match(css, /\.story-section--limitations h2 span\s*\{\s*color: #ff5a1f;\s*\}/);
  assert.match(css, /\.limitations-copy span\s*\{\s*display: block;\s*\}/);
  assert.match(css, /\.limitation-grid\s*\{[\s\S]*gap: 18px;[\s\S]*grid-template-columns: repeat\(5, minmax\(0, 1fr\)\);[\s\S]*margin-top: 56px;[\s\S]*max-width: 1280px;/);
  assert.match(css, /\.limitation-card\s*\{[\s\S]*border-radius: 28px;[\s\S]*min-height: 303px;[\s\S]*padding: 26px 25px 28px;/);
  assert.match(css, /\.limitation-card--yellow\s*\{\s*background: #ffc842;\s*\}/);
  assert.match(css, /\.limitation-card--pink\s*\{\s*background: #ff8fb1;\s*\}/);
  assert.match(css, /\.limitation-card--cream\s*\{\s*background: #fff1da;\s*\}/);
  assert.match(css, /\.limitation-card--green\s*\{[\s\S]*background: #3da06b;[\s\S]*color: #fff1da;/);
  assert.match(css, /\.limitation-card--black\s*\{[\s\S]*background: #1a1310;[\s\S]*color: #fff1da;/);
  assert.match(css, /\.limitation-card__number\s*\{[\s\S]*font-family: var\(--font-display\);[\s\S]*font-size: 56px;[\s\S]*line-height: 0\.9;/);
  assert.match(css, /\.limitation-card--green \.limitation-card__number\s*\{\s*color: #ffc842;\s*\}/);
  assert.match(css, /\.limitation-card--black \.limitation-card__number\s*\{\s*color: #ff5a1f;\s*\}/);
  assert.match(css, /\.limitation-card__title\s*\{[\s\S]*font-family: var\(--font-display\);[\s\S]*font-size: 22px;[\s\S]*letter-spacing: -0\.22px;[\s\S]*line-height: 0\.98;[\s\S]*margin-top: 14px;/);
  assert.match(css, /\.limitation-card__body\s*\{[\s\S]*font-family: var\(--font-body\);[\s\S]*font-size: 14px;[\s\S]*line-height: 21px;[\s\S]*margin: 15px 0 0;/);
  assert.match(css, /\.limitation-card__body-line\s*\{[\s\S]*display: block;[\s\S]*white-space: nowrap;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.limitation-card__title-line,[\s\S]*\.limitation-card__body-line\s*\{[\s\S]*white-space: normal;/);
  assert.doesNotMatch(css, /\.limitation-card span\s*\{/);
});
