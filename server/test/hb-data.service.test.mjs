import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { HbDataService } = require("../dist/hb/hb-data.service.js");

test("HbDataService loads canonical score payloads", () => {
  const service = new HbDataService();
  const summary = service.getSummary();
  const scores = service.getHbScores();
  const restaurants = service.getRestaurants();

  assert.equal(summary.metadata.restaurantCount, 50);
  assert.equal(summary.metadata.factorCount, 10);
  assert.equal(summary.metadata.graphPointCount, 500);
  assert.equal(summary.advisor, "Prof. Jee Won Kim");
  assert.equal(scores.factors.length, 10);
  assert.equal(scores.points.length, 500);
  assert.equal(restaurants.length, 50);
  assert.equal(summary.metadata.mapPointCount, 50);
  assert.equal(typeof scores.points[0].displayPlaceName, "string");
  assert.equal(typeof restaurants[0].displayPlaceName, "string");
  assert.equal(typeof restaurants[0].latitude, "number");
  assert.equal(typeof restaurants[0].longitude, "number");
  assert.equal(typeof restaurants[0].district, "string");
});

test("HbDataService returns reports and rejects missing ids", () => {
  const service = new HbDataService();
  const restaurant = service.getRestaurants()[0];
  const report = service.getRestaurantReport(restaurant.placeId);

  assert.equal(report.placeId, restaurant.placeId);
  assert.equal(report.displayPlaceName, restaurant.displayPlaceName);
  assert.equal(report.latitude, restaurant.latitude);
  assert.equal(report.longitude, restaurant.longitude);
  assert.equal(report.district, restaurant.district);
  assert.equal(report.factorScores.length, 10);
  assert.ok(report.keywords.length > 0);
  assert.equal(report.adjectiveBuckets.length, 4);
  assert.ok(report.adjectiveBuckets.some((bucket) => bucket.count > 0));
  assert.equal(report.funnyKeywords, undefined);
  assert.throws(() => service.getRestaurantReport("missing-place"), /Restaurant report not found/);
});
