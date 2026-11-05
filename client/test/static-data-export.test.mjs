import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { test } from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("static data export mirrors the canonical web report payload", async () => {
  await execFileAsync(process.execPath, ["scripts/export-static-data.mjs"]);

  const source = await readJson("../datasets/derived/hb-score-web-report.json");
  const summary = await readJson("public/data/summary.json");
  const scores = await readJson("public/data/hb-scores.json");
  const restaurants = await readJson("public/data/restaurants.json");
  const reportFiles = await readdir("public/data/reports");

  assert.equal(summary.title, source.summary.title);
  assert.deepEqual(summary.metadata, {
    restaurantCount: source.metadata.restaurantCount,
    factorCount: source.metadata.factorCount,
    graphPointCount: source.metadata.graphPointCount,
    mapPointCount: source.metadata.mapPointCount,
    reportCount: source.metadata.reportCount
  });
  assert.deepEqual(scores.factors, source.factors);
  assert.equal(scores.points.length, source.points.length);
  assert.deepEqual(restaurants, source.restaurants);
  assert.equal(reportFiles.length, source.reports.length);

  for (const restaurant of restaurants) {
    const report = await readJson(`public/data/reports/${restaurant.placeId}.json`);
    assert.equal(report.placeId, restaurant.placeId);
  }
});

test("client reads static data files instead of a backend API", async () => {
  const api = await readFile("lib/api.ts", "utf8");
  const nextConfig = await readFile("next.config.ts", "utf8");
  const packageJson = await readJson("package.json");

  assert.match(api, /const dataBasePath = "\/data"/);
  assert.match(api, /"summary\.json"/);
  assert.match(api, /"hb-scores\.json"/);
  assert.match(api, /"restaurants\.json"/);
  assert.match(api, /`reports\/\$\{encodeURIComponent\(placeId\)\}\.json`/);
  assert.doesNotMatch(api, /\/api\//);
  assert.doesNotMatch(api, /NEXT_PUBLIC_API_BASE_URL/);
  assert.doesNotMatch(nextConfig, /rewrites|8097|HIDDEN_BITES_API_PROXY_TARGET/);
  assert.match(packageJson.scripts.dev, /^yarn data:export && /);
  assert.match(packageJson.scripts["build:web"], /yarn data:export && next build/);
});
