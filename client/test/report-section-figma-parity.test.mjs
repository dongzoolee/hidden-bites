import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("selected report section follows the Figma interaction and visual contract", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const reportPanel = await readFile("components/RestaurantReportPanel.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");

  assert.match(experience, /const selectedRestaurantPickerId = "selected-restaurant-picker"/);
  assert.match(experience, /const selectedRestaurantDropdownButtonId = "selected-restaurant-picker-button"/);
  assert.match(experience, /document\.getElementById\(selectedRestaurantPickerId\)\?\.scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
  assert.match(experience, /document\.getElementById\(selectedRestaurantDropdownButtonId\)\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(experience, /aria-haspopup="listbox"/);
  assert.match(experience, /role="listbox"/);
  assert.doesNotMatch(experience, /id="selected-report-restaurant-select"|selected-heading__select restaurant-select/);

  assert.ok(reportPanel.indexOf("<h3>{report.displayPlaceName}</h3>") < reportPanel.indexOf("restaurant-report-meta"));
  assert.match(reportPanel, /<span aria-label=\{`\$\{report\.googlePlaceRating\.toFixed\(1\)\} star rating`\}>★★★★★<\/span>/);
  assert.match(reportPanel, /<strong>\{report\.googlePlaceRating\.toFixed\(1\)\}<\/strong>/);
  assert.match(reportPanel, /Macro analysis: Categories were defined/);
  assert.match(reportPanel, /<strong>by selecting the top 10 most frequent adjective<\/strong>/);
  assert.match(reportPanel, /<span>s for each emotion\.<\/span>/);
  assert.match(reportPanel, /<strong>Click a keyword chip<\/strong>/);
  assert.match(reportPanel, /buildKeywordFooter\(snippet, report\.keywords, keywordEvidence\?\.keyword \?\? null\)/);
  assert.match(reportPanel, /return `KEYWORD: \$\{uniqueKeywords\.join\(" · "\)\}`/);
  assert.match(reportPanel, /className="emotion-graph__header"/);
  assert.match(reportPanel, /Emotion Graph/);
  assert.match(reportPanel, /category share \(%\)/);
  assert.match(reportPanel, /vs all-50 average/);
  assert.match(reportPanel, /className="emotion-graph__marker"/);
  assert.match(reportPanel, /className="emotion-graph__bar"/);
  assert.match(reportPanel, /className="restaurant-explorer"/);
  assert.match(reportPanel, /<button type="button" onClick=\{onExploreAnotherRestaurant\}>/);
  assert.doesNotMatch(reportPanel, /<select|ExternalLink|googleMapsUri|restaurant-select/);

  assert.match(css, /\.selected-restaurant-dropdown__menu\s*\{[\s\S]*font-size: 16px;|\.selected-restaurant-dropdown__option strong\s*\{[\s\S]*font-size: 16px;/);
  assert.match(css, /\.restaurant-report-meta\s*\{[\s\S]*font-family: var\(--font-mono\);[\s\S]*white-space: nowrap;/);
  assert.match(css, /\.restaurant-rating span\s*\{[\s\S]*font-family: var\(--font-body\);[\s\S]*font-size: 22px;[\s\S]*letter-spacing: 1px;/);
  assert.match(css, /\.restaurant-rating strong\s*\{[\s\S]*font-family: var\(--font-display\);[\s\S]*font-size: 44px;[\s\S]*line-height: 44px;/);
  assert.match(css, /\.report-section-heading p strong\s*\{[\s\S]*font-weight: 800;[\s\S]*text-decoration: underline;/);
  assert.match(css, /\.emotion-graph__plot\s*\{[\s\S]*height: 480px;[\s\S]*overflow-x: auto;/);
  assert.match(css, /\.emotion-graph__grid span\s*\{[\s\S]*border-top: 2px solid rgba\(26, 19, 16, 0\.12\);/);
  assert.match(css, /\.emotion-graph__marker\s*\{[\s\S]*transform: rotate\(45deg\);/);
  assert.match(css, /\.emotion-graph__bar\s*\{[\s\S]*border-radius: 999px 999px 0 0;[\s\S]*font-family: var\(--font-chart\);/);
  assert.match(css, /\.snippet\s*\{[\s\S]*border-radius: 22px;[\s\S]*padding: 22px 24px;/);
  assert.match(css, /\.snippet footer\s*\{[\s\S]*font-family: var\(--font-mono\);[\s\S]*font-size: 12px;/);
  assert.match(css, /\.restaurant-explorer button\s*\{[\s\S]*border-radius: 20px;[\s\S]*font-family: var\(--font-airbnb-bold\);/);
});
