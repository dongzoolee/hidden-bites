import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";

const scorePath = "datasets/derived/hb-score-restaurants.json";
const pointsPath = "datasets/derived/hb-score-factor-restaurant-points.json";
const locationsPath = "datasets/google-places-seoul-top-restaurants-2026-05-15-locations.json";
const reviewsDir = "datasets/google-maps-reviews-2026-05-16";
const outputPath = "datasets/derived/hb-score-web-report.json";

const emotionDictionary = [
  {
    id: "comfort",
    label: "Comfort",
    emoji: "😌",
    terms: ["편안", "아늑", "깔끔", "깨끗", "쾌적", "여유", "정갈", "조용", "친절", "안심"]
  },
  {
    id: "delight",
    label: "Delight",
    emoji: "😊",
    terms: ["맛있", "즐겁", "기분", "좋았", "최고", "만족", "추천", "재방문", "행복", "감동"]
  },
  {
    id: "surprise",
    label: "Surprise",
    emoji: "✨",
    terms: ["특별", "독특", "신기", "색다", "새롭", "놀라", "인상", "처음", "시그니처", "트러플"]
  },
  {
    id: "neutral",
    label: "Neutral",
    emoji: "·",
    terms: ["무난", "괜찮", "평범", "보통", "적당", "기본", "일반", "간단"]
  },
  {
    id: "friction",
    label: "Friction",
    emoji: "!",
    terms: ["웨이팅", "대기", "기다", "붐비", "시끄", "복잡", "늦", "불편", "아쉬", "비싸"]
  }
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
const reviewFiles = (await readdir(reviewsDir))
  .filter((name) => name.endsWith(".json"))
  .filter((name) => !name.endsWith(".partial.json"))
  .filter((name) => name !== "run-metadata.json")
  .sort();

const reviewsByPlaceId = new Map();
const locationByPlaceId = new Map();

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
  const emotionBuckets = buildEmotionBuckets(reviews);
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
    emotionBuckets,
    keywords,
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
    restaurantCount: scoreData.restaurants.length,
    factorCount: scoreData.factors.length,
    graphPointCount: pointsData.points.length,
    mapPointCount: restaurantLocationsByPlaceId.size,
    reportCount: reports.length,
    emotionBucketCount: emotionDictionary.length
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

function buildEmotionBuckets(reviews) {
  const buckets = emotionDictionary.map((bucket) => {
    const matchedTerms = new Map();
    let count = 0;

    for (const review of reviews) {
      const text = typeof review.text === "string" ? review.text : "";

      for (const term of bucket.terms) {
        const matches = text.match(new RegExp(escapeRegExp(term), "g"));
        const termCount = matches?.length ?? 0;

        if (termCount > 0) {
          matchedTerms.set(term, (matchedTerms.get(term) ?? 0) + termCount);
          count += termCount;
        }
      }
    }

    return {
      id: bucket.id,
      label: bucket.label,
      emoji: bucket.emoji,
      count,
      share: 0,
      terms: [...matchedTerms.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko-KR"))
        .slice(0, 5)
        .map(([term]) => term)
    };
  });
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);

  return buckets.map((bucket) => ({
    ...bucket,
    share: total > 0 ? round(bucket.count / total, 4) : 0
  }));
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
  const keywordIndex = keyword === "recent" ? 0 : text.indexOf(keyword);
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
