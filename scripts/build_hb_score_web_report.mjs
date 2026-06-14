import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { buildDisplayPlaceName } from "./restaurant_display_names.mjs";
import { reviewEmotionCategories } from "./review_emotion_categories.mjs";

const scorePath = "datasets/derived/hb-score-restaurants.json";
const pointsPath = "datasets/derived/hb-score-factor-restaurant-points.json";
const locationsPath = "datasets/google-places-seoul-top-restaurants-2026-05-15-locations.json";
const reviewsDir = "datasets/google-maps-reviews-2026-05-16";
const adjectivesPath = "datasets/derived/review-adjectives.json";
const outputPath = "datasets/derived/hb-score-web-report.json";

const funnyKeywordCategories = [
  { id: "crunch-boss", label: "🥨 Crunch Boss", color: "#F7C948", terms: ["바삭", "바삭바삭", "crispy", "crunchy", "튀김", "튀겨", "겉바속촉", "crunch", "fried", "golden", "crisped"] },
  { id: "fire-bite", label: "🔥 Fire Bite", color: "#F4626C", terms: ["매운", "맵다", "매워", "불맛", "칼칼", "spicy", "hot", "chili", "pepper", "fiery", "불닭", "청양"] },
  { id: "portion-monster", label: "🍖 Portion Monster", color: "#4CAF7D", terms: ["양이 많", "푸짐", "huge", "generous", "massive", "big portion", "양많", "가성비 좋", "넉넉"] },
  { id: "wallet-saver", label: "💰 Wallet Saver", color: "#F4845F", terms: ["저렴", "싸다", "싸요", "가성비", "cheap", "affordable", "reasonable", "value", "budget", "가격 대비"] },
  { id: "worth-the-wait", label: "⏳ Worth the Wait", color: "#9B82F3", terms: ["웨이팅", "줄", "기다", "대기", "wait", "line", "queue", "worth it", "줄 서", "대기 시간"] },
  { id: "hidden-boss", label: "🕵️ Hidden Boss", color: "#5BB8F5", terms: ["숨겨진", "골목", "찾기 어", "hidden", "secret", "alley", "tucked", "gem", "underrated", "모르는 사람"] },
  { id: "homefeel-energy", label: "🏡 Uncle / Homefeel Energy", color: "#F4C842", terms: ["친절", "따뜻", "편안", "아늑", "homey", "friendly", "cozy", "warm", "welcoming", "정겨"] },
  { id: "emotional-support-meal", label: "🍲 Emotional Support Meal", color: "#F4626C", terms: ["위로", "힐링", "고향", "어머니", "엄마", "comfort", "heartwarming", "nostalgic", "soothing", "추억"] },
  { id: "date-night-certified", label: "💑 Date Night Certified", color: "#4CAF7D", terms: ["데이트", "연인", "분위기", "romantic", "couple", "date", "anniversary", "intimate", "ambiance", "분위기 좋"] },
  { id: "squad-goals", label: "👫 Squad Goals", color: "#F4845F", terms: ["친구", "무리", "단체", "friend", "group", "squad", "birthday", "party", "함께", "모임"] },
  { id: "office-escape-plan", label: "🏢 Office Escape Plan", color: "#9B82F3", terms: ["점심", "직장", "회사", "lunch", "office", "work", "colleagues", "quick", "nearby", "weekday", "회식"] },
  { id: "vibe-check", label: "🌊 Vibe Check", color: "#5BB8F5", terms: ["분위기", "인테리어", "감성", "aesthetic", "vibe", "atmosphere", "인스타", "예쁜", "인생샷"] }
];

const stopwords = new Set([
  "그리고",
  "그래서",
  "하지만",
  "정말",
  "너무",
  "진짜",
  "완전",
  "매우",
  "많이",
  "조금",
  "그냥",
  "다시",
  "방문",
  "먹었",
  "먹고",
  "먹기",
  "메뉴",
  "음식",
  "식사",
  "맛집",
  "서울",
  "리뷰",
  "사진",
  "서비스",
  "분위기",
  "가격",
  "사람",
  "친구",
  "가족",
  "직원",
  "예약",
  "시간",
  "place",
  "restaurant",
  "food",
  "good",
  "nice",
  "great",
  "really",
  "very",
  "visit",
  "visited"
]);

const scoreData = JSON.parse(await readFile(scorePath, "utf8"));
const pointsData = JSON.parse(await readFile(pointsPath, "utf8"));
const locationsData = JSON.parse(await readFile(locationsPath, "utf8"));
const adjectiveData = JSON.parse(await readFile(adjectivesPath, "utf8"));
const reviewFiles = (await readdir(reviewsDir))
  .filter((name) => name.endsWith(".json"))
  .filter((name) => !name.endsWith(".partial.json"))
  .filter((name) => name !== "run-metadata.json")
  .sort();

const reviewsByPlaceId = new Map();
const locationByPlaceId = new Map();
const adjectiveCategories = buildAdjectiveCategories();
const adjectiveProfileByRank = buildAdjectiveProfileByRank(adjectiveData.per_restaurant, adjectiveCategories);
const adjectiveAverageShareByCategoryId = buildAdjectiveAverageShareByCategoryId(adjectiveProfileByRank, adjectiveCategories);

for (const place of locationsData.places ?? []) {
  if (typeof place.place_id === "string") {
    locationByPlaceId.set(place.place_id, place);
  }
}

const restaurantLocationsByPlaceId = new Map(scoreData.restaurants.map((restaurant) => [restaurant.place_id, locationForPlace(restaurant.place_id)]));

for (const fileName of reviewFiles) {
  const payload = JSON.parse(await readFile(join(reviewsDir, fileName), "utf8"));
  const placeId = payload.metadata?.place?.place_id;
  const reviews = Array.isArray(payload.reviews) ? payload.reviews : [];

  if (typeof placeId === "string") {
    reviewsByPlaceId.set(placeId, reviews);
  }
}

const restaurantTokenCounts = new Map();
const documentFrequency = new Map();

for (const restaurant of scoreData.restaurants) {
  const reviews = reviewsByPlaceId.get(restaurant.place_id) ?? [];
  const counts = new Map();
  const seenForRestaurant = new Set();

  for (const review of reviews) {
    const text = typeof review.text === "string" ? review.text : "";
    const tokens = extractTokens(text);

    for (const token of tokens) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
      seenForRestaurant.add(token);
    }
  }

  for (const token of seenForRestaurant) {
    documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
  }

  restaurantTokenCounts.set(restaurant.place_id, counts);
}

const reports = scoreData.restaurants.map((restaurant) => {
  const reviews = reviewsByPlaceId.get(restaurant.place_id) ?? [];
  const counts = restaurantTokenCounts.get(restaurant.place_id) ?? new Map();
  const location = restaurantLocationsByPlaceId.get(restaurant.place_id);
  const keywords = buildKeywordEvidence(reviews, counts, scoreData.restaurants.length);
  const adjectiveBuckets = buildAdjectiveBucketsForRestaurant(restaurant.place_rank);
  const funnyKeywords = buildFunnyKeywords(reviews);
  const factorScores = scoreData.factors.map((factor) => {
    const score = restaurant.scores[factor.id];

    return {
      factorId: factor.id,
      factorLabel: factor.label,
      hbScore: round(score.hb_score, 4),
      rawHbScore: round(score.raw_hb_score, 6),
      countBonus: round(score.count_bonus, 6),
      meanFactorRelevance: round(score.mean_factor_relevance, 6),
      meanFactorDistance: round(score.mean_factor_distance, 6)
    };
  });
  const topFactor = [...factorScores].sort((a, b) => b.hbScore - a.hbScore)[0];

  return {
    placeId: restaurant.place_id,
    placeRank: restaurant.place_rank,
    placeName: restaurant.place_name,
    displayPlaceName: buildDisplayPlaceName(restaurant.place_id, restaurant.place_name),
    formattedAddress: restaurant.formatted_address,
    googleMapsUri: restaurant.google_maps_uri,
    googlePlaceRating: restaurant.google_place_rating,
    popularityCount: restaurant.popularity_count,
    collectedReviewCount: restaurant.collected_review_count,
    collectionStatus: restaurant.collection_status,
    latitude: location.latitude,
    longitude: location.longitude,
    district: location.district,
    topFactor,
    factorScores,
    adjectiveBuckets,
    keywords,
    funnyKeywords,
    reviewSample: reviews.slice(0, 4).map((review) => toSnippet(review, "recent"))
  };
});

const output = {
  metadata: {
    generatedAt: new Date().toISOString(),
    sourceScorePath: scorePath,
    sourcePointsPath: pointsPath,
    sourceLocationsPath: locationsPath,
    sourceReviewDir: reviewsDir,
    sourceAdjectivesPath: adjectivesPath,
    restaurantCount: scoreData.restaurants.length,
    factorCount: scoreData.factors.length,
    graphPointCount: pointsData.points.length,
    mapPointCount: restaurantLocationsByPlaceId.size,
    reportCount: reports.length,
    adjectiveBucketCount: adjectiveCategories.length,
    adjectiveTaxonomySource: "figma:g1aNjTsNQVz5KPEVqMC4qY:313:9492",
    funnyKeywordCategoryCount: funnyKeywordCategories.length
  },
  summary: {
    title: "Hidden Bites",
    description: "Google top 50 restaurants in Seoul, recalculated by Hidden Bites factor scores.",
    question: "What are the factors for Matjip in Seoul?",
    className: "26-1 Data Visualization @ Sogang A&T",
    advisor: "Prof. Jee Won Kim",
    members: ["dongzoolee", "Eunhong", "Madina", "Emilia"],
    qna: [
      {
        question: "Why we chose GMap?",
        answer: "Naver Map has many advertising-like reviews and no star points, while Kakao Map has fewer reviews. Google Maps gave us a comparable review volume and rating signal."
      },
      {
        question: "How we chose top 50 restaurants?",
        answer: "We filtered for Seoul restaurants with recent five-year review availability, high review volume, and high star points, then recalculated them through Hidden Bites factors."
      }
    ]
  },
  factors: scoreData.factors.map((factor, order) => ({
    id: factor.id,
    label: factor.label,
    order,
    hypotheses: factor.hypotheses,
    structuredRatingLabel: factor.structured_rating_label
  })),
  restaurants: scoreData.restaurants.map((restaurant) => ({
    placeId: restaurant.place_id,
    placeRank: restaurant.place_rank,
    placeName: restaurant.place_name,
    displayPlaceName: buildDisplayPlaceName(restaurant.place_id, restaurant.place_name),
    formattedAddress: restaurant.formatted_address,
    googleMapsUri: restaurant.google_maps_uri,
    googlePlaceRating: restaurant.google_place_rating,
    popularityCount: restaurant.popularity_count,
    collectedReviewCount: restaurant.collected_review_count,
    collectionStatus: restaurant.collection_status,
    latitude: restaurantLocationsByPlaceId.get(restaurant.place_id).latitude,
    longitude: restaurantLocationsByPlaceId.get(restaurant.place_id).longitude,
    district: restaurantLocationsByPlaceId.get(restaurant.place_id).district,
    topHbScore: round(Math.max(...Object.values(restaurant.scores).map((score) => score.hb_score)), 4)
  })),
  points: pointsData.points.map((point) => ({
    factorId: point.factor_id,
    factorLabel: point.factor_label,
    factorOrder: point.factor_order,
    hbScore: round(point.hb_score, 4),
    rawHbScore: round(point.raw_hb_score, 6),
    countBonus: round(point.count_bonus, 6),
    placeRank: point.place_rank,
    placeId: point.place_id,
    placeName: point.place_name,
    displayPlaceName: buildDisplayPlaceName(point.place_id, point.place_name),
    googlePlaceRating: point.google_place_rating,
    popularityCount: point.popularity_count,
    collectedReviewCount: point.collected_review_count
  })),
  reports
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);

console.log(JSON.stringify(output.metadata, null, 2));

function locationForPlace(placeId) {
  const place = locationByPlaceId.get(placeId);

  if (!place) {
    throw new Error(`Missing Seoul map location for ${placeId}`);
  }

  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error(`Invalid Seoul map location for ${placeId}`);
  }

  return {
    latitude: round(latitude, 7),
    longitude: round(longitude, 7),
    district: typeof place.district === "string" && place.district.length > 0 ? place.district : "미확인"
  };
}

function buildKeywordEvidence(reviews, counts, restaurantCount) {
  const candidates = [...counts.entries()]
    .map(([keyword, count]) => {
      const df = documentFrequency.get(keyword) ?? 1;
      const idf = Math.log((restaurantCount + 1) / (df + 1)) + 1;
      const lengthBoost = Math.min(keyword.length / 5, 1.6);

      return {
        keyword,
        count,
        score: count * idf * lengthBoost
      };
    })
    .filter((entry) => entry.count >= 2)
    .filter((entry) => !stopwords.has(entry.keyword))
    .sort((a, b) => b.score - a.score || a.keyword.localeCompare(b.keyword, "ko-KR"))
    .slice(0, 8);

  return candidates
    .map((candidate) => ({
      keyword: candidate.keyword,
      score: round(candidate.score, 4),
      count: candidate.count,
      snippets: pickKeywordReviews(reviews, candidate.keyword).map((review) => toSnippet(review, candidate.keyword))
    }))
    .filter((candidate) => candidate.snippets.length > 0)
    .slice(0, 6);
}

function pickKeywordReviews(reviews, keyword) {
  const keywordParts = keyword.split(/\s+/).filter(Boolean);
  const exactMatches = reviews.filter((review) => typeof review.text === "string" && review.text.includes(keyword));

  if (exactMatches.length > 0) {
    return exactMatches.slice(0, 4);
  }

  return reviews
    .filter((review) => {
      const text = typeof review.text === "string" ? review.text : "";

      return keywordParts.every((part) => text.includes(part));
    })
    .slice(0, 4);
}

function buildFunnyKeywords(reviews) {
  const eligibleReviews = reviews
    .map((review, index) => ({
      review,
      index,
      text: typeof review.text === "string" ? review.text.replace(/\s+/g, " ").trim() : ""
    }))
    .filter((entry) => entry.text.length >= 15);

  return funnyKeywordCategories.map((category) => {
    const matches = eligibleReviews
      .map((entry) => ({
        ...entry,
        matchedTerms: matchFunnyTerms(entry.text, category.terms)
      }))
      .filter((entry) => entry.matchedTerms.length > 0);
    const matchCount = matches.reduce((sum, entry) => sum + entry.matchedTerms.length, 0);
    const snippets = [...matches]
      .sort((left, right) => {
        const leftRating = typeof left.review.rating === "number" ? left.review.rating : 0;
        const rightRating = typeof right.review.rating === "number" ? right.review.rating : 0;

        return right.matchedTerms.length - left.matchedTerms.length || rightRating - leftRating || left.index - right.index;
      })
      .slice(0, 4)
      .map((entry) => ({
        ...toSnippet(entry.review, entry.matchedTerms[0] ?? "recent"),
        matchedTerms: entry.matchedTerms
      }));

    return {
      id: category.id,
      label: category.label,
      color: category.color,
      terms: category.terms,
      reviewCount: matches.length,
      matchCount,
      snippets
    };
  });
}

function matchFunnyTerms(text, terms) {
  const normalizedText = text.toLowerCase();

  return terms.filter((term) => normalizedText.includes(term.toLowerCase()));
}

function extractTokens(text) {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{Script=Hangul}a-z0-9\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const rawTokens = normalized.match(/[\p{Script=Hangul}a-z0-9]{2,}/gu) ?? [];
  const tokens = new Set();

  for (const token of rawTokens) {
    if (!stopwords.has(token) && token.length >= 2 && token.length <= 12) {
      tokens.add(token);
    }
  }

  for (let index = 0; index < rawTokens.length - 1; index += 1) {
    const phrase = `${rawTokens[index]} ${rawTokens[index + 1]}`;

    if (phrase.length <= 18 && ![rawTokens[index], rawTokens[index + 1]].some((token) => stopwords.has(token))) {
      tokens.add(phrase);
    }
  }

  return tokens;
}

function toSnippet(review, keyword) {
  const text = typeof review.text === "string" ? review.text.replace(/\s+/g, " ").trim() : "";
  const maxLength = 150;
  const keywordIndex = keyword === "recent" ? 0 : text.toLowerCase().indexOf(keyword.toLowerCase());
  const start = keywordIndex > 40 ? keywordIndex - 40 : 0;
  const clipped = text.slice(start, start + maxLength);

  return {
    text: clipped.length < text.length ? `${clipped}...` : clipped,
    author: typeof review.author === "string" ? review.author : "Google Maps reviewer",
    rating: typeof review.rating === "number" ? review.rating : null,
    relativeTime: typeof review.relative_time === "string" ? review.relative_time : null,
    sourceReviewId: typeof review.source_review_id === "string" ? review.source_review_id : `${basename(review.place_id ?? "review")}-${keyword}`
  };
}

function round(value, digits) {
  const multiplier = 10 ** digits;

  return Math.round(value * multiplier) / multiplier;
}

function buildAdjectiveCategories() {
  if (reviewEmotionCategories.length !== 7) {
    throw new Error(`Expected 7 review emotion categories, received ${reviewEmotionCategories.length}`);
  }

  const seenIds = new Set();
  const seenAdjectives = new Set();

  return reviewEmotionCategories.map((category, index) => {
    if (seenIds.has(category.id)) {
      throw new Error(`Duplicate review emotion category id: ${category.id}`);
    }

    seenIds.add(category.id);

    if (!Array.isArray(category.adjectives) || category.adjectives.length !== 10) {
      throw new Error(`Invalid adjective list for category: ${category.id}`);
    }

    for (const adjective of category.adjectives) {
      if (seenAdjectives.has(adjective)) {
        throw new Error(`Duplicate review emotion adjective: ${adjective}`);
      }

      seenAdjectives.add(adjective);
    }

    return {
      id: category.id,
      label: category.label,
      emoji: category.emoji,
      koreanLabel: category.koreanLabel,
      color: category.color,
      order: index,
      adjectives: category.adjectives
    };
  });
}

function buildAdjectiveProfileByRank(perRestaurant, categories) {
  if (!Array.isArray(perRestaurant) || perRestaurant.length !== 50) {
    throw new Error(`Expected 50 review adjective restaurant profiles, received ${Array.isArray(perRestaurant) ? perRestaurant.length : "invalid"}`);
  }

  const wordToCategoryId = new Map();

  for (const category of categories) {
    for (const adjective of category.adjectives) {
      wordToCategoryId.set(adjective, category.id);
    }
  }

  const profiles = new Map();

  for (const restaurant of perRestaurant) {
    const rank = restaurant.place_rank;
    const adjectiveCounts = getRestaurantAdjectiveCounts(restaurant);

    if (typeof rank !== "number") {
      throw new Error("Review adjective profile is missing numeric place_rank");
    }

    if (profiles.has(rank)) {
      throw new Error(`Duplicate review adjective profile for rank ${rank}`);
    }

    const totalAdjectiveCount = adjectiveCounts.reduce((sum, adjective) => sum + normalizeCount(adjective.count), 0);

    if (totalAdjectiveCount <= 0) {
      throw new Error(`Review adjective profile has no adjective count for rank ${rank}`);
    }

    const bucketWork = new Map(categories.map((category) => [category.id, { count: 0, topAdjectives: [] }]));

    for (const adjective of adjectiveCounts) {
      if (typeof adjective.adj !== "string") {
        continue;
      }

      const categoryId = wordToCategoryId.get(adjective.adj);

      if (!categoryId) {
        continue;
      }

      const bucket = bucketWork.get(categoryId);
      const count = normalizeCount(adjective.count);
      bucket.count += count;
      bucket.topAdjectives.push({
        adjective: adjective.adj,
        count
      });
    }

    const matchedAdjectiveCount = [...bucketWork.values()].reduce((sum, bucket) => sum + bucket.count, 0);

    if (matchedAdjectiveCount <= 0) {
      throw new Error(`Review adjective profile has no mapped adjectives for rank ${rank}`);
    }

    profiles.set(rank, {
      rank,
      totalAdjectiveCount,
      matchedAdjectiveCount,
      buckets: categories.map((category) => {
        const bucket = bucketWork.get(category.id);

        return {
          id: category.id,
          label: category.label,
          emoji: category.emoji,
          koreanLabel: category.koreanLabel,
          adjectives: category.adjectives,
          count: bucket.count,
          share: round(bucket.count / totalAdjectiveCount, 4),
          topAdjectives: bucket.topAdjectives.sort((left, right) => right.count - left.count || left.adjective.localeCompare(right.adjective, "ko-KR"))
        };
      })
    });
  }

  return profiles;
}

function getRestaurantAdjectiveCounts(restaurant) {
  if (Array.isArray(restaurant.adjective_counts) && restaurant.adjective_counts.length > 0) {
    return restaurant.adjective_counts;
  }

  if (Array.isArray(restaurant.top30_adjs) && restaurant.top30_adjs.length > 0) {
    return restaurant.top30_adjs;
  }

  return [];
}

function buildAdjectiveAverageShareByCategoryId(profileByRank, categories) {
  const averages = new Map();

  for (const category of categories) {
    const totalShare = [...profileByRank.values()].reduce((sum, profile) => {
      const bucket = profile.buckets.find((candidate) => candidate.id === category.id);

      return sum + (bucket?.share ?? 0);
    }, 0);

    averages.set(category.id, round(totalShare / profileByRank.size, 4));
  }

  return averages;
}

function buildAdjectiveBucketsForRestaurant(placeRank) {
  const profile = adjectiveProfileByRank.get(placeRank);

  if (!profile) {
    throw new Error(`Missing review adjective profile for rank ${placeRank}`);
  }

  return profile.buckets.map((bucket) => ({
    ...bucket,
    averageShare: adjectiveAverageShareByCategoryId.get(bucket.id) ?? 0
  }));
}

function normalizeCount(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}
