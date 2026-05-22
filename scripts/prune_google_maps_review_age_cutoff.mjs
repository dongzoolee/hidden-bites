import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_DATASET_DIR = "datasets/google-maps-reviews-2026-05-16";

function parseArgs(argv) {
  const args = {
    datasetDir: DEFAULT_DATASET_DIR,
    maxReviewAgeYears: 5,
    execute: false,
    check: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--dataset-dir") {
      args.datasetDir = next;
      index += 1;
    } else if (arg === "--max-review-age-years") {
      args.maxReviewAgeYears = Number(next);
      index += 1;
    } else if (arg === "--execute") {
      args.execute = true;
    } else if (arg === "--check") {
      args.check = true;
    }
  }

  if (!Number.isFinite(args.maxReviewAgeYears) || args.maxReviewAgeYears < 0) {
    throw new Error("--max-review-age-years must be a non-negative number");
  }

  return args;
}

function parseRelativeAgeYears(relativeTime) {
  if (!relativeTime) return null;
  const text = relativeTime.trim().toLowerCase();
  if (!text) return null;
  const numberMatch = text.match(/([0-9]+(?:\.[0-9]+)?)/);
  const value = numberMatch ? Number(numberMatch[1]) : text.includes("한") ? 1 : null;
  if (text.includes("년") || text.includes("year")) return value;
  if (text.includes("개월") || text.includes("달") || text.includes("month")) return value === null ? null : value / 12;
  if (text.includes("주") || text.includes("week")) return value === null ? null : value / 52;
  if (text.includes("일") || text.includes("day")) return value === null ? null : value / 365;
  if (text.includes("시간") || text.includes("hour")) return 0;
  if (text.includes("분") || text.includes("minute")) return 0;
  if (text.includes("초") || text.includes("second")) return 0;
  if (text.includes("방금") || text.includes("just now")) return 0;
  return null;
}

function isOlderThanReviewAgeLimit(relativeTime, maxReviewAgeYears) {
  const ageYears = parseRelativeAgeYears(relativeTime);
  return ageYears !== null && ageYears > maxReviewAgeYears;
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf-8"));
}

async function writeJsonAtomic(filePath, value) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
  await fs.rename(tempPath, filePath);
}

async function listReviewJsonFiles(datasetDir) {
  const entries = await fs.readdir(datasetDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(datasetDir, entry.name))
    .filter((filePath) => filePath.endsWith(".json") && !filePath.endsWith("run-metadata.json"))
    .sort();
}

function prunePayload(payload, filePath, args) {
  const reviews = Array.isArray(payload.reviews) ? payload.reviews : [];
  const keptReviews = [];
  const removedReviews = [];

  for (const review of reviews) {
    if (isOlderThanReviewAgeLimit(review.relative_time, args.maxReviewAgeYears)) {
      removedReviews.push(review);
    } else {
      keptReviews.push(review);
    }
  }

  if (removedReviews.length === 0) {
    return {
      payload,
      summary: {
        file: filePath,
        rank: payload.metadata?.place_rank ?? null,
        name: payload.metadata?.place?.name ?? null,
        before: reviews.length,
        after: keptReviews.length,
        removed: 0,
        removed_relative_times: {},
      },
    };
  }

  const removedRelativeTimes = removedReviews.reduce((accumulator, review) => {
    const relativeTime = review.relative_time || "";
    accumulator[relativeTime] = (accumulator[relativeTime] || 0) + 1;
    return accumulator;
  }, {});

  const metadata = {
    ...(payload.metadata || {}),
    collected_reviews: keptReviews.length,
    max_review_age_years: args.maxReviewAgeYears,
    age_pruned_reviews: removedReviews.length,
    age_pruned_at: new Date().toISOString(),
    age_pruned_relative_times: removedRelativeTimes,
  };

  return {
    payload: {
      ...payload,
      metadata,
      reviews: keptReviews,
    },
    summary: {
      file: filePath,
      rank: metadata.place_rank ?? null,
      name: metadata.place?.name ?? null,
      before: reviews.length,
      after: keptReviews.length,
      removed: removedReviews.length,
      removed_relative_times: removedRelativeTimes,
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = await listReviewJsonFiles(args.datasetDir);
  const summaries = [];

  for (const filePath of files) {
    const payload = await readJson(filePath);
    const result = prunePayload(payload, filePath, args);
    summaries.push(result.summary);
    if (args.execute && result.summary.removed > 0) {
      await writeJsonAtomic(filePath, result.payload);
    }
  }

  const changedSummaries = summaries.filter((summary) => summary.removed > 0);
  const totalRemoved = changedSummaries.reduce((sum, summary) => sum + summary.removed, 0);
  const output = {
    dataset_dir: args.datasetDir,
    max_review_age_years: args.maxReviewAgeYears,
    mode: args.execute ? "execute" : args.check ? "check" : "dry_run",
    file_count: summaries.length,
    changed_file_count: changedSummaries.length,
    total_removed_reviews: totalRemoved,
    changed_files: changedSummaries,
  };

  console.log(JSON.stringify(output, null, 2));

  if (args.check && totalRemoved > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
