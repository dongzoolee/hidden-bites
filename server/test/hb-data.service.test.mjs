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
  assert.equal(scores.factors.length, 10);
  assert.equal(scores.points.length, 500);
  assert.equal(restaurants.length, 50);
});

test("HbDataService returns reports and rejects missing ids", () => {
  const service = new HbDataService();
  const restaurant = service.getRestaurants()[0];
  const report = service.getRestaurantReport(restaurant.placeId);

  assert.equal(report.placeId, restaurant.placeId);
  assert.equal(report.factorScores.length, 10);
  assert.ok(report.keywords.length > 0);
  assert.throws(() => service.getRestaurantReport("missing-place"), /Restaurant report not found/);
});
