import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const foreignTextPattern = /[A-Za-z一-龥ぁ-ゟ゠-ヿ]/u;
const hangulPattern = /\p{Script=Hangul}/u;

test("kakao map route builds from client-owned restaurant data", async () => {
  const page = await readFile("app/map/page.tsx", "utf8");
  const rawData = await readFile("data/top-restaurants-locations.json", "utf8");
  const data = JSON.parse(rawData);

  assert.match(page, /@\/data\/top-restaurants-locations\.json/);
  assert.match(page, /function toRestaurantSummary\(place: TopRestaurantLocation\): RestaurantSummary/);
  assert.match(page, /const restaurants = data\.places\.map\(toRestaurantSummary\)/);
  assert.match(page, /<KakaoMap restaurants=\{restaurants\} \/>/);
  assert.match(page, /placeId: place\.place_id/);
  assert.match(page, /displayPlaceName: place\.display_name/);
  assert.match(page, /latitude: place\.location\.latitude/);
  assert.match(page, /longitude: place\.location\.longitude/);
  assert.doesNotMatch(page, /from "fs"|from "path"|process\.cwd|datasets\//);
  assert.equal(data.metadata.place_count, 50);
  assert.equal(data.places.length, 50);

  for (const place of data.places) {
    assert.equal(typeof place.place_id, "string");
    assert.equal(typeof place.name, "string");
    assert.equal(typeof place.display_name, "string");
    assert.match(place.display_name, hangulPattern);
    assert.doesNotMatch(place.display_name, foreignTextPattern);
    assert.equal(typeof place.location.latitude, "number");
    assert.equal(typeof place.location.longitude, "number");
    assert.ok(Number.isFinite(place.location.latitude));
    assert.ok(Number.isFinite(place.location.longitude));
  }
});
