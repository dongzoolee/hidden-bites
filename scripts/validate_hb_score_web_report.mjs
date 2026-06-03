import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertKoreanDisplayPlaceName } from "./restaurant_display_names.mjs";

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
assert.equal(reportData.metadata.mapPointCount, 50);

const restaurantIds = new Set(reportData.restaurants.map((restaurant) => restaurant.placeId));
const reportIds = new Set(reportData.reports.map((report) => report.placeId));
const displayNameByPlaceId = new Map(reportData.restaurants.map((restaurant) => [restaurant.placeId, restaurant.displayPlaceName]));

assert.equal(restaurantIds.size, 50);
assert.deepEqual(restaurantIds, reportIds);

for (const restaurant of reportData.restaurants) {
  assert.equal(typeof restaurant.latitude, "number");
  assert.equal(typeof restaurant.longitude, "number");
  assert.equal(typeof restaurant.district, "string");
  assertKoreanDisplayPlaceName(restaurant.displayPlaceName, restaurant.placeId);
  assert.notEqual(restaurant.placeName, "");
}

for (const point of reportData.points) {
  assert.equal(typeof point.factorId, "string");
  assert.equal(typeof point.placeId, "string");
  assert.equal(point.displayPlaceName, displayNameByPlaceId.get(point.placeId));
  assertKoreanDisplayPlaceName(point.displayPlaceName, `${point.placeId}:${point.factorId}`);
  assert.ok(point.hbScore >= 0 && point.hbScore <= 5);
}

for (const report of reportData.reports) {
  assert.equal(report.factorScores.length, 10);
  assert.ok(report.emotionBuckets.length >= 5);
  assert.ok(report.keywords.length > 0);
  assert.ok(report.reviewSample.length > 0);
  assert.equal(typeof report.latitude, "number");
  assert.equal(typeof report.longitude, "number");
  assert.equal(typeof report.district, "string");
  assert.equal(report.displayPlaceName, displayNameByPlaceId.get(report.placeId));
  assertKoreanDisplayPlaceName(report.displayPlaceName, report.placeId);

  for (const keyword of report.keywords) {
    assert.ok(keyword.snippets.length > 0);
  }
}

console.log("hb-score web report validation passed");
