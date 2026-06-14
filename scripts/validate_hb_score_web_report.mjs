import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assertKoreanDisplayPlaceName } from "./restaurant_display_names.mjs";
import { reviewEmotionCategories } from "./review_emotion_categories.mjs";

const scorePath = "datasets/derived/hb-score-restaurants.json";
const pointsPath = "datasets/derived/hb-score-factor-restaurant-points.json";
const adjectivesPath = "datasets/derived/review-adjectives.json";
const reportPath = "datasets/derived/hb-score-web-report.json";

const scoreData = JSON.parse(await readFile(scorePath, "utf8"));
const pointsData = JSON.parse(await readFile(pointsPath, "utf8"));
const adjectiveData = JSON.parse(await readFile(adjectivesPath, "utf8"));
const reportData = JSON.parse(await readFile(reportPath, "utf8"));

assert.equal(scoreData.restaurants.length, 50);
assert.equal(scoreData.factors.length, 10);
assert.equal(pointsData.points.length, 500);
assert.equal(adjectiveData.per_restaurant.length, 50);
assert.equal(adjectiveData.metadata.full_adjective_counts, true);
assert.equal(reviewEmotionCategories.length, 7);
assert.equal(reportData.restaurants.length, 50);
assert.equal(reportData.factors.length, 10);
assert.equal(reportData.points.length, 500);
assert.equal(reportData.reports.length, 50);
assert.equal(reportData.metadata.mapPointCount, 50);
assert.equal(reportData.metadata.sourceAdjectivesPath, adjectivesPath);
assert.equal(reportData.metadata.adjectiveBucketCount, 7);
assert.equal(reportData.metadata.adjectiveTaxonomySource, "figma:g1aNjTsNQVz5KPEVqMC4qY:313:9492");

const restaurantIds = new Set(reportData.restaurants.map((restaurant) => restaurant.placeId));
const reportIds = new Set(reportData.reports.map((report) => report.placeId));
const displayNameByPlaceId = new Map(reportData.restaurants.map((restaurant) => [restaurant.placeId, restaurant.displayPlaceName]));
const scoreRanks = new Set(scoreData.restaurants.map((restaurant) => restaurant.place_rank));
const adjectiveRanks = new Set(adjectiveData.per_restaurant.map((restaurant) => restaurant.place_rank));

assert.equal(restaurantIds.size, 50);
assert.deepEqual(restaurantIds, reportIds);
assert.deepEqual(scoreRanks, adjectiveRanks);

for (const restaurant of adjectiveData.per_restaurant) {
  const adjectiveCounts = getRestaurantAdjectiveCounts(restaurant);
  const filteredAdjectiveCounts = Array.isArray(restaurant.filtered_adjective_counts) ? restaurant.filtered_adjective_counts : [];
  const topAdjectives = Array.isArray(restaurant.top30_adjs) ? restaurant.top30_adjs : [];
  const categoryWords = new Set(reviewEmotionCategories.flatMap((category) => category.adjectives));
  const matchedAdjectives = adjectiveCounts.filter((adjective) => categoryWords.has(adjective.adj));

  assert.ok(adjectiveCounts.length > 0);
  assert.ok(filteredAdjectiveCounts.length > 0);
  assert.ok(topAdjectives.length > 0);
  assert.ok(matchedAdjectives.length > 0);

  assertValidAdjectiveCounts(adjectiveCounts);
  assertValidAdjectiveCounts(filteredAdjectiveCounts);
  assertValidAdjectiveCounts(topAdjectives);
}

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
  assert.equal(report.emotionBuckets, undefined);
  assert.equal(report.adjectiveBuckets.length, 7);
  assert.equal(report.funnyKeywords.length, 12);
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

  assert.ok(report.funnyKeywords.some((keyword) => keyword.reviewCount > 0));

  for (const keyword of report.funnyKeywords) {
    assert.equal(typeof keyword.id, "string");
    assert.equal(typeof keyword.label, "string");
    assert.equal(typeof keyword.color, "string");
    assert.ok(Array.isArray(keyword.terms));
    assert.ok(keyword.reviewCount >= 0);
    assert.ok(keyword.matchCount >= 0);
    assert.ok(keyword.snippets.length <= 4);

    if (keyword.reviewCount === 0) {
      assert.equal(keyword.snippets.length, 0);
    }

    for (const snippet of keyword.snippets) {
      assert.ok(snippet.text.length >= 15);
      assert.ok(snippet.matchedTerms.length > 0);

      for (const matchedTerm of snippet.matchedTerms) {
        assert.ok(keyword.terms.includes(matchedTerm));
      }
    }
  }

  assert.ok(report.adjectiveBuckets.some((bucket) => bucket.count > 0));

  for (const bucket of report.adjectiveBuckets) {
    assert.equal(typeof bucket.id, "string");
    assert.equal(typeof bucket.label, "string");
    assert.equal(typeof bucket.emoji, "string");
    assert.equal(typeof bucket.koreanLabel, "string");
    assert.ok(Array.isArray(bucket.adjectives));
    assert.equal(bucket.adjectives.length, 10);
    assert.ok(bucket.adjectives.every((adjective) => typeof adjective === "string" && adjective.length > 0));
    assert.ok(bucket.count >= 0);
    assert.ok(bucket.share >= 0 && bucket.share <= 1);
    assert.ok(bucket.averageShare >= 0 && bucket.averageShare <= 1);
    assert.ok(Array.isArray(bucket.topAdjectives));

    for (const adjective of bucket.topAdjectives) {
      assert.equal(typeof adjective.adjective, "string");
      assert.ok(adjective.count > 0);
    }
  }
}

const mutanReport = reportData.reports.find((report) => report.placeRank === 1);
assert.ok(mutanReport);
assert.equal(mutanReport.adjectiveBuckets.filter((bucket) => bucket.count > 0).length, 7);

console.log("hb-score web report validation passed");

function getRestaurantAdjectiveCounts(restaurant) {
  if (Array.isArray(restaurant.adjective_counts) && restaurant.adjective_counts.length > 0) {
    return restaurant.adjective_counts;
  }

  if (Array.isArray(restaurant.top30_adjs) && restaurant.top30_adjs.length > 0) {
    return restaurant.top30_adjs;
  }

  return [];
}

function assertValidAdjectiveCounts(adjectiveCounts) {
  const seen = new Set();

  for (const adjective of adjectiveCounts) {
    assert.equal(typeof adjective.adj, "string");
    assert.ok(adjective.adj.length > 0);
    assert.equal(typeof adjective.count, "number");
    assert.ok(adjective.count > 0);
    assert.equal(seen.has(adjective.adj), false);
    seen.add(adjective.adj);
  }
}
