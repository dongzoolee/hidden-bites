import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const request = require("supertest");
const { Test } = require("@nestjs/testing");
const { AppModule } = require("../dist/app.module.js");

let app;

before(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule]
  }).compile();

  app = moduleRef.createNestApplication();
  await app.init();
});

after(async () => {
  await app.close();
});

test("serves health and score API", async () => {
  await request(app.getHttpServer()).get("/health").expect(200).expect((response) => {
    assert.equal(response.body.ok, true);
    assert.equal(response.body.restaurantCount, 50);
  });

  await request(app.getHttpServer()).get("/api/hb-scores").expect(200).expect((response) => {
    assert.equal(response.body.factors.length, 10);
    assert.equal(response.body.points.length, 500);
    assert.equal(typeof response.body.points[0].displayPlaceName, "string");
  });
});

test("serves selected report and 404 for missing report", async () => {
  const restaurants = await request(app.getHttpServer()).get("/api/restaurants").expect(200);
  const placeId = restaurants.body[0].placeId;

  assert.equal(typeof restaurants.body[0].latitude, "number");
  assert.equal(typeof restaurants.body[0].longitude, "number");
  assert.equal(typeof restaurants.body[0].district, "string");
  assert.equal(typeof restaurants.body[0].displayPlaceName, "string");

  await request(app.getHttpServer()).get(`/api/restaurants/${encodeURIComponent(placeId)}/report`).expect(200).expect((response) => {
    assert.equal(response.body.displayPlaceName, restaurants.body[0].displayPlaceName);
    assert.equal(response.body.latitude, restaurants.body[0].latitude);
    assert.equal(response.body.longitude, restaurants.body[0].longitude);
    assert.equal(response.body.district, restaurants.body[0].district);
  });
  await request(app.getHttpServer()).get("/api/restaurants/missing-place/report").expect(404);
});
