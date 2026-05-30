import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const scorePath = "datasets/derived/hb-score-restaurants.json";
const pointsPath = "datasets/derived/hb-score-factor-restaurant-points.json";
const reportPath = "datasets/derived/hb-score-web-report.json";

const scoreData = JSON.parse(await readFile(scorePath, "utf8"));
const pointsData = JSON.parse(await readFile(pointsPath, "utf8"));
const reportData = JSON.parse(await readFile(reportPath, "utf8"));

assert.equal(scoreData.restaurants.length, 50);
assert.equal(scoreData.factors.length, 10);
assert.equal(pointsData.points.length, 500);
assert.equal(reportData.restaurants.length, 50);
assert.equal(reportData.factors.length, 10);
assert.equal(reportData.points.length, 500);
assert.equal(reportData.reports.length, 50);

const restaurantIds = new Set(reportData.restaurants.map((restaurant) => restaurant.placeId));
const reportIds = new Set(reportData.reports.map((report) => report.placeId));

assert.equal(restaurantIds.size, 50);
assert.deepEqual(restaurantIds, reportIds);

for (const point of reportData.points) {
  assert.equal(typeof point.factorId, "string");
  assert.equal(typeof point.placeId, "string");
  assert.ok(point.hbScore >= 0 && point.hbScore <= 5);
}

for (const report of reportData.reports) {
  assert.equal(report.factorScores.length, 10);
  assert.ok(report.emotionBuckets.length >= 5);
  assert.ok(report.keywords.length > 0);
  assert.ok(report.reviewSample.length > 0);

  for (const keyword of report.keywords) {
    assert.ok(keyword.snippets.length > 0);
  }
}

console.log("hb-score web report validation passed");
