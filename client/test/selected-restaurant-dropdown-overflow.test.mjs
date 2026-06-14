import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("selected restaurant dropdown lets long restaurant names exceed its minimum width", async () => {
  const css = await readFile("app/globals.css", "utf8");

  assert.match(css, /\.selected-heading\s*\{[\s\S]*overflow: visible;/);
  assert.match(css, /\.selected-restaurant-dropdown\s*\{[\s\S]*max-width: none;[\s\S]*min-width: 750px;[\s\S]*width: max-content;/);
  assert.match(css, /\.selected-restaurant-dropdown__button\s*\{[\s\S]*min-width: 750px;[\s\S]*overflow: visible;[\s\S]*width: max-content;/);
  assert.match(css, /\.selected-restaurant-dropdown__button span\s*\{[\s\S]*flex: 0 0 auto;[\s\S]*min-width: max-content;[\s\S]*overflow: visible;[\s\S]*text-overflow: clip;[\s\S]*white-space: nowrap;/);
  assert.match(css, /\.selected-restaurant-dropdown__menu\s*\{[\s\S]*min-width: 100%;[\s\S]*right: auto;[\s\S]*width: max-content;/);
  assert.match(css, /\.selected-restaurant-dropdown__option strong\s*\{[\s\S]*overflow: visible;[\s\S]*text-overflow: clip;[\s\S]*white-space: nowrap;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.selected-restaurant-dropdown\s*\{[\s\S]*max-width: none;[\s\S]*min-width: 32rem;/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.selected-restaurant-dropdown__button\s*\{[\s\S]*min-width: 32rem;/);

  assert.doesNotMatch(css, /\.selected-restaurant-dropdown__button span\s*\{[^}]*text-overflow: ellipsis;[^}]*\}/);
});
