import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_TOP_PATH = "datasets/google-places-seoul-top-restaurants-2026-05-15.json";
const DEFAULT_OUTPUT_DIR = "datasets/google-maps-reviews-2026-05-16";
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DEFAULT_PLAYWRIGHT_CORE_PATH = "/tmp/hidden-bites-playwright/node_modules/playwright-core/index.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const args = {
    topPath: DEFAULT_TOP_PATH,
    outputDir: DEFAULT_OUTPUT_DIR,
    startIndex: 1,
    limitPlaces: null,
    maxReviewsPerPlace: null,
    maxMinutes: null,
    maxReviewAgeYears: null,
    scrollDelayMs: 1200,
    idleScrolls: 80,
    headful: false,
    chromePath: process.env.CHROME_PATH || DEFAULT_CHROME_PATH,
    userDataDir: null,
    profileDirectory: null,
    prewarmRanks: [],
    onlyRanks: [],
    resumeIdleFromZero: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];
    if (arg === "--top-path") {
      args.topPath = next;
      index += 1;
    } else if (arg === "--output-dir") {
      args.outputDir = next;
      index += 1;
    } else if (arg === "--start-index") {
      args.startIndex = Number(next);
      index += 1;
    } else if (arg === "--limit-places") {
      args.limitPlaces = Number(next);
      index += 1;
    } else if (arg === "--max-reviews-per-place") {
      args.maxReviewsPerPlace = Number(next);
      index += 1;
    } else if (arg === "--max-minutes") {
      args.maxMinutes = Number(next);
      index += 1;
    } else if (arg === "--max-review-age-years") {
      args.maxReviewAgeYears = Number(next);
      index += 1;
    } else if (arg === "--scroll-delay-ms") {
      args.scrollDelayMs = Number(next);
      index += 1;
    } else if (arg === "--idle-scrolls") {
      args.idleScrolls = Number(next);
      index += 1;
    } else if (arg === "--chrome-path") {
      args.chromePath = next;
      index += 1;
    } else if (arg === "--user-data-dir") {
      args.userDataDir = next;
      index += 1;
    } else if (arg === "--profile-directory") {
      args.profileDirectory = next;
      index += 1;
    } else if (arg === "--prewarm-ranks") {
      args.prewarmRanks = next.split(",").map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value > 0);
      index += 1;
    } else if (arg === "--only-ranks") {
      args.onlyRanks = next.split(",").map((value) => Number(value.trim())).filter((value) => Number.isInteger(value) && value > 0);
      index += 1;
    } else if (arg === "--resume-idle-from-zero") {
      args.resumeIdleFromZero = true;
    } else if (arg === "--headful") {
      args.headful = true;
    }
  }

  return args;
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .toLowerCase();
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf-8"));
}

async function loadChromium() {
  try {
    const module = await import("playwright-core");
    return module.chromium || module.default?.chromium;
  } catch {
    const modulePath = process.env.PLAYWRIGHT_CORE_PATH || DEFAULT_PLAYWRIGHT_CORE_PATH;
    const module = await import(pathToFileURL(modulePath).href);
    return module.chromium || module.default?.chromium;
  }
}

async function writeJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf-8");
  await fs.rename(tempPath, filePath);
}

async function clickIfVisible(page, locator, timeout = 3000) {
  try {
    await locator.waitFor({ state: "visible", timeout });
    await locator.click({ timeout });
    return true;
  } catch {
    return false;
  }
}

async function openReviews(page, place) {
  try {
    await page.goto(place.google_maps_uri, { waitUntil: "domcontentloaded", timeout: 45000 });
  } catch (error) {
    console.error(JSON.stringify({ event: "navigation_timeout_continue", name: place.name, message: String(error?.message || error).split("\n")[0] }));
  }
  await page.waitForTimeout(2500);

  let reviewTab = page.locator('button[role="tab"][aria-label*="리뷰"]');
  try {
    await reviewTab.waitFor({ state: "visible", timeout: 12000 });
  } catch {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(6000);
    reviewTab = page.locator('button[role="tab"][aria-label*="리뷰"]');
    await reviewTab.waitFor({ state: "visible", timeout: 30000 });
  }
  await reviewTab.click();
  await page.waitForTimeout(1500);

  const sortButton = page.locator('button[aria-label="리뷰 정렬"]');
  if (await clickIfVisible(page, sortButton, 5000)) {
    const newest = page.getByRole("menuitemradio", { name: "최신순" });
    await clickIfVisible(page, newest, 5000);
    await page.waitForTimeout(2500);
  }
}

async function expandVisibleReviews(page) {
  return await page.evaluate(() => {
    let clicked = 0;
    const buttons = Array.from(document.querySelectorAll('button[aria-label="더보기"]')).slice(0, 40);
    for (const button of buttons) {
      const text = button.textContent || "";
      if (text.includes("자세히 보기") || text.includes("더보기")) {
        button.click();
        clicked += 1;
      }
    }
    return clicked;
  });
}

async function extractVisibleReviews(page) {
  return await page.evaluate(() => {
    const parseRating = (label) => {
      if (!label) return null;
      const match = label.match(/([0-9]+(?:\\.[0-9]+)?)/);
      return match ? Number(match[1]) : null;
    };

    return Array.from(document.querySelectorAll("div.jftiEf[data-review-id]")).map((card) => {
      const ratingLabel = card.querySelector('[role="img"][aria-label*="별표"]')?.getAttribute("aria-label") || null;
      const photoButtons = Array.from(card.querySelectorAll('button[aria-label*="리뷰에 포함된"]'));
      const mealTypeText = Array.from(card.querySelectorAll(".RfDO5c")).map((node) => node.textContent?.trim()).filter(Boolean);
      return {
        source_review_id: card.getAttribute("data-review-id"),
        author: card.querySelector(".d4r55")?.textContent?.trim() || null,
        author_stats: card.querySelector(".RfnDt")?.textContent?.trim() || null,
        rating: parseRating(ratingLabel),
        rating_label: ratingLabel,
        relative_time: card.querySelector(".rsqaWe")?.textContent?.trim() || null,
        text: card.querySelector(".wiI7pd")?.textContent?.trim() || "",
        meal_type_text: mealTypeText,
        photo_count_visible: photoButtons.length,
        raw_text: card.textContent?.trim().replace(/\\s+/g, " ") || "",
      };
    });
  });
}

async function scrollReviews(page) {
  return await page.evaluate(() => {
    const scroller = Array.from(document.querySelectorAll("div.m6QErb.DxyBCb"))
      .filter((element) => element.scrollHeight > element.clientHeight + 200)
      .sort((a, b) => b.scrollHeight - a.scrollHeight)[0];
    if (!scroller) return null;
    const before = scroller.scrollTop;
    scroller.scrollTop = Math.min(scroller.scrollTop + Math.max(1800, scroller.clientHeight * 3), scroller.scrollHeight);
    return {
      before,
      after: scroller.scrollTop,
      clientHeight: scroller.clientHeight,
      scrollHeight: scroller.scrollHeight,
      atBottom: scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 8,
    };
  });
}

async function loadExistingPlace(filePath) {
  try {
    const existing = await readJson(filePath);
    const reviews = new Map();
    for (const review of existing.reviews || []) {
      if (review.source_review_id) reviews.set(review.source_review_id, review);
    }
    return { existing, reviews };
  } catch {
    return { existing: null, reviews: new Map() };
  }
}

function mergeReview(existing, incoming) {
  if (!existing) return incoming;
  const existingTextLength = existing.text?.length || 0;
  const incomingTextLength = incoming.text?.length || 0;
  return incomingTextLength >= existingTextLength ? { ...existing, ...incoming } : { ...incoming, ...existing };
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
  if (!Number.isFinite(maxReviewAgeYears)) return false;
  const ageYears = parseRelativeAgeYears(relativeTime);
  return ageYears !== null && ageYears > maxReviewAgeYears;
}

async function collectPlace(page, place, rank, args, startedAt) {
  const slug = `${String(rank).padStart(3, "0")}-${slugify(place.name || place.place_id)}`;
  const partialPath = path.join(args.outputDir, `${slug}.partial.json`);
  const finalPath = path.join(args.outputDir, `${slug}.json`);
  const { reviews } = await loadExistingPlace(partialPath);
  const finalExisting = await loadExistingPlace(finalPath);
  for (const [reviewId, review] of finalExisting.reviews) reviews.set(reviewId, review);
  for (const [reviewId, review] of Array.from(reviews.entries())) {
    if (isOlderThanReviewAgeLimit(review.relative_time, args.maxReviewAgeYears)) reviews.delete(reviewId);
  }

  const targetReviews = args.maxReviewsPerPlace || place.user_rating_count || null;
  let idleCount = reviews.size > 0 && !args.resumeIdleFromZero ? -reviews.size : 0;
  let lastCount = reviews.size;
  let scrollCount = 0;
  let status = "running";
  let lastScrollState = null;
  let ageCutoffHits = 0;
  let ageFilteredReviews = 0;
  let ageCutoffRelativeTime = null;

  await openReviews(page, place);

  while (true) {
    await expandVisibleReviews(page);
    const visibleReviews = await extractVisibleReviews(page);
    let sawOlderThanLimit = false;
    for (const review of visibleReviews) {
      if (!review.source_review_id) continue;
      if (isOlderThanReviewAgeLimit(review.relative_time, args.maxReviewAgeYears)) {
        sawOlderThanLimit = true;
        ageCutoffRelativeTime = ageCutoffRelativeTime || review.relative_time;
        if (!reviews.has(review.source_review_id)) ageFilteredReviews += 1;
        continue;
      }
      reviews.set(review.source_review_id, mergeReview(reviews.get(review.source_review_id), {
        ...review,
        place_id: place.place_id,
        place_name: place.name,
        place_rank: rank,
        google_maps_uri: place.google_maps_uri,
        collected_at: new Date().toISOString(),
        source: "google_maps_ui",
        sort: "newest",
      }));
    }
    ageCutoffHits = sawOlderThanLimit ? ageCutoffHits + 1 : 0;

    if (reviews.size === lastCount) {
      idleCount += 1;
    } else {
      idleCount = 0;
      lastCount = reviews.size;
    }

    const payload = {
      metadata: {
        source: "google_maps_ui",
        collection_method: "playwright_google_maps_reviews_tab_scroll",
        place_rank: rank,
        place,
        target_reviews: targetReviews,
        collected_reviews: reviews.size,
        scroll_count: scrollCount,
        idle_count: idleCount,
        max_review_age_years: args.maxReviewAgeYears,
        age_cutoff_hits: ageCutoffHits,
        age_cutoff_relative_time: ageCutoffRelativeTime,
        age_filtered_reviews: ageFilteredReviews,
        status,
        updated_at: new Date().toISOString(),
      },
      reviews: Array.from(reviews.values()),
    };
    await writeJsonAtomic(partialPath, payload);

    if (targetReviews && reviews.size >= targetReviews) {
      status = "target_reached";
      break;
    }
    if (args.maxMinutes && (Date.now() - startedAt) / 60000 >= args.maxMinutes) {
      status = "time_limit_reached";
      break;
    }
    if (Number.isFinite(args.maxReviewAgeYears) && ageCutoffHits >= 3) {
      status = "age_cutoff_reached";
      break;
    }
    if (idleCount >= args.idleScrolls) {
      status = "idle_limit_reached";
      break;
    }

    lastScrollState = await scrollReviews(page);
    scrollCount += 1;
    if (lastScrollState?.atBottom) idleCount += 1;
    await page.waitForTimeout(args.scrollDelayMs);

    if (scrollCount % 20 === 0) {
      console.log(JSON.stringify({
        event: "progress",
        rank,
        name: place.name,
        collected: reviews.size,
        target: targetReviews,
        scrollCount,
        idleCount,
        maxReviewAgeYears: args.maxReviewAgeYears,
        ageCutoffHits,
        ageCutoffRelativeTime,
        ageFilteredReviews,
        lastScrollState,
      }));
    }
  }

  const finalPayload = {
    metadata: {
      source: "google_maps_ui",
      collection_method: "playwright_google_maps_reviews_tab_scroll",
      place_rank: rank,
      place,
      target_reviews: targetReviews,
      collected_reviews: reviews.size,
      scroll_count: scrollCount,
      idle_count: idleCount,
      max_review_age_years: args.maxReviewAgeYears,
      age_cutoff_hits: ageCutoffHits,
      age_cutoff_relative_time: ageCutoffRelativeTime,
      age_filtered_reviews: ageFilteredReviews,
      status,
      updated_at: new Date().toISOString(),
    },
    reviews: Array.from(reviews.values()),
  };

  if (status === "target_reached" || status === "idle_limit_reached" || status === "age_cutoff_reached") {
    await writeJsonAtomic(finalPath, finalPayload);
  }
  await writeJsonAtomic(partialPath, finalPayload);
  console.log(JSON.stringify({ event: "place_done", rank, name: place.name, collected: reviews.size, target: targetReviews, status }));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = Date.now();
  const topData = await readJson(args.topPath);
  const allPlaces = topData.places.map((place, index) => ({ place, rank: index + 1 }));
  const placesByRank = new Map(allPlaces.map((item) => [item.rank, item]));
  const places = args.onlyRanks.length > 0
    ? args.onlyRanks.map((rank) => placesByRank.get(rank)).filter(Boolean)
    : allPlaces.filter((item) => item.rank >= args.startIndex).slice(0, args.limitPlaces || undefined);

  await fs.mkdir(args.outputDir, { recursive: true });
  await writeJsonAtomic(path.join(args.outputDir, "run-metadata.json"), {
    source_top_path: args.topPath,
    output_dir: args.outputDir,
    started_at: new Date(startedAt).toISOString(),
    args,
    places: places.map(({ place, rank }) => ({ rank, place_id: place.place_id, name: place.name, user_rating_count: place.user_rating_count, google_maps_uri: place.google_maps_uri })),
  });

  const chromium = await loadChromium();
  const browserArgs = ["--lang=ko-KR", "--disable-blink-features=AutomationControlled"];
  if (args.profileDirectory) browserArgs.push(`--profile-directory=${args.profileDirectory}`);

  const runWithContext = async (context, close) => {
    try {
      const page = context.pages()[0] || await context.newPage();
      page.setDefaultTimeout(30000);

      for (const rank of args.prewarmRanks) {
        const place = topData.places[rank - 1];
        if (!place) continue;
        console.log(JSON.stringify({ event: "prewarm", rank, name: place.name }));
        await page.goto(place.google_maps_uri, { waitUntil: "domcontentloaded", timeout: 45000 }).catch((error) => {
          console.error(JSON.stringify({ event: "prewarm_error", rank, name: place.name, message: String(error?.message || error).split("\n")[0] }));
        });
        await page.waitForTimeout(5000);
      }

      for (const { place, rank } of places) {
        if (args.maxMinutes && (Date.now() - startedAt) / 60000 >= args.maxMinutes) break;
        console.log(JSON.stringify({ event: "place_start", rank, name: place.name, target: place.user_rating_count }));
        try {
          await collectPlace(page, place, rank, args, startedAt);
        } catch (error) {
          const message = String(error?.message || error);
          console.error(JSON.stringify({ event: "place_error", rank, name: place.name, message }));
          if (message.includes("Target page") && message.includes("closed")) break;
        }
      }
    } finally {
      await close();
    }
  };

  if (args.userDataDir) {
    const context = await chromium.launchPersistentContext(args.userDataDir, {
      executablePath: args.chromePath,
      headless: !args.headful,
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
      viewport: { width: 1280, height: 900 },
      args: browserArgs,
    });
    await runWithContext(context, () => context.close());
    return;
  }

  const browser = await chromium.launch({
    executablePath: args.chromePath,
    headless: !args.headful,
    args: browserArgs,
  });
  const context = await browser.newContext({
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    viewport: { width: 1280, height: 900 },
  });
  await runWithContext(context, () => browser.close());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
