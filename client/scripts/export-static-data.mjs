import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const clientRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(clientRoot, "../datasets/derived/hb-score-web-report.json");
const outputRoot = resolve(clientRoot, "public/data");
const placeIdPattern = /^[A-Za-z0-9_-]+$/;

const payload = JSON.parse(await readFile(sourcePath, "utf8"));

assertArray(payload.restaurants, "restaurants");
assertArray(payload.factors, "factors");
assertArray(payload.points, "points");
assertArray(payload.reports, "reports");

const reportPlaceIds = new Set();

for (const report of payload.reports) {
  if (typeof report.placeId !== "string" || !placeIdPattern.test(report.placeId)) {
    throw new Error(`Report placeId is not a safe file name: ${String(report.placeId)}`);
  }

  if (reportPlaceIds.has(report.placeId)) {
    throw new Error(`Duplicate report placeId: ${report.placeId}`);
  }

  reportPlaceIds.add(report.placeId);
}

for (const restaurant of payload.restaurants) {
  if (!reportPlaceIds.has(restaurant.placeId)) {
    throw new Error(`Restaurant has no report: ${String(restaurant.placeId)}`);
  }
}

const summary = {
  ...payload.summary,
  metadata: {
    restaurantCount: payload.metadata.restaurantCount,
    factorCount: payload.metadata.factorCount,
    graphPointCount: payload.metadata.graphPointCount,
    mapPointCount: payload.metadata.mapPointCount,
    reportCount: payload.metadata.reportCount
  }
};

await rm(outputRoot, { recursive: true, force: true });
await mkdir(resolve(outputRoot, "reports"), { recursive: true });

await Promise.all([
  writeJson("summary.json", summary),
  writeJson("hb-scores.json", { factors: payload.factors, points: payload.points }),
  writeJson("restaurants.json", payload.restaurants),
  ...payload.reports.map((report) => writeJson(`reports/${report.placeId}.json`, report))
]);

console.log(`exported ${payload.reports.length} reports to ${outputRoot}`);

function assertArray(value, name) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Expected non-empty ${name} array in ${sourcePath}`);
  }
}

async function writeJson(relativePath, value) {
  await writeFile(resolve(outputRoot, relativePath), JSON.stringify(value));
}
