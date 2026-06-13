import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("footer matches the Figma title rhythm and metadata", async () => {
  const experience = await readFile("components/HiddenBitesExperience.tsx", "utf8");
  const css = await readFile("app/globals.css", "utf8");
  const footerTitleRules = [...css.matchAll(/\.story-footer h2\s*\{(?<body>[\s\S]*?)\}/g)];
  const footerTitleRule = footerTitleRules.find((rule) => rule.groups?.body.includes("20.83vw"))?.groups?.body ?? "";

  assert.match(experience, /const footerTeamMembers: FooterTeamMember\[\] = \[/);
  assert.match(experience, /name: "dongzoolee", role: "developer", email: "me@leed\.at"/);
  assert.match(experience, /name: "Eunhong Kim", role: "designer", email: "its4hong@gmail\.com"/);
  assert.match(experience, /name: "Madina", role: null, email: "sadullayeva4554@gmail\.com"/);
  assert.match(experience, /name: "Emilia", role: null, email: "arndtemilia2@gmail\.com"/);
  assert.match(experience, /className="footer-team-grid"/);
  assert.match(experience, /className="footer-team-role"/);
  assert.doesNotMatch(experience, /data\.summary\.members\.join/);
  assert.match(experience, /26-1 Data Visualization/);
  assert.match(experience, /Sogang University · Art & Technology/);
  assert.match(experience, /advised by Prof\. JeeWon Kim/);
  assert.match(experience, /web-desktop edition · 2026\.05 · vol\.01/);

  assert.match(footerTitleRule, /font-size: clamp\(5\.4rem, 20\.83vw, 18\.75rem\);/);
  assert.match(footerTitleRule, /line-height: 0\.875;/);
  assert.doesNotMatch(footerTitleRule, /line-height: 0\.73;/);
  assert.match(css, /\.story-footer h2 span\s*\{[\s\S]*white-space: nowrap;/);
  assert.match(css, /\.footer-meta\s*\{[\s\S]*gap: 32px;[\s\S]*min-height: 108px;[\s\S]*padding-top: 37px;/);
  assert.match(css, /\.footer-meta strong\s*\{[\s\S]*font-size: 11px;[\s\S]*letter-spacing: 1\.98px;[\s\S]*margin-bottom: 12px;/);
  assert.match(css, /\.footer-copy,[\s\S]*\.footer-team-grid\s*\{[\s\S]*font-size: 14px;[\s\S]*line-height: 22\.4px;/);
  assert.match(css, /\.footer-team-grid\s*\{[\s\S]*column-gap: 16px;[\s\S]*grid-template-columns: minmax\(0, max-content\) minmax\(0, max-content\);/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.footer-team-grid\s*\{[\s\S]*grid-template-columns: 1fr;/);
});
