export interface HbFactor {
  id: string;
  label: string;
  order: number;
  hypotheses: string[];
  structuredRatingLabel: string | null;
}

export interface HbScorePoint {
  factorId: string;
  factorLabel: string;
  factorOrder: number;
  hbScore: number;
  rawHbScore: number;
  countBonus: number;
  placeRank: number;
  placeId: string;
  placeName: string;
  displayPlaceName: string;
  googlePlaceRating: number;
  popularityCount: number;
  collectedReviewCount: number;
}

export interface RestaurantSummary {
  placeId: string;
  placeRank: number;
  placeName: string;
  displayPlaceName: string;
  formattedAddress: string;
  googleMapsUri: string;
  googlePlaceRating: number;
  popularityCount: number;
  collectedReviewCount: number;
  collectionStatus: string;
  latitude: number;
  longitude: number;
  district: string;
  topHbScore: number;
}

export interface ReviewSnippet {
  text: string;
  author: string;
  rating: number | null;
  relativeTime: string | null;
  sourceReviewId: string;
}

export interface KeywordEvidence {
  keyword: string;
  score: number;
  count: number;
  snippets: ReviewSnippet[];
}

export interface EmotionBucket {
  id: string;
  label: string;
  emoji: string;
  count: number;
  share: number;
  terms: string[];
}

export interface FactorScore {
  factorId: string;
  factorLabel: string;
  hbScore: number;
  rawHbScore: number;
  countBonus: number;
  meanFactorRelevance: number;
  meanFactorDistance: number;
}

export interface RestaurantReport {
  placeId: string;
  placeRank: number;
  placeName: string;
  displayPlaceName: string;
  formattedAddress: string;
  googleMapsUri: string;
  googlePlaceRating: number;
  popularityCount: number;
  collectedReviewCount: number;
  collectionStatus: string;
  latitude: number;
  longitude: number;
  district: string;
  topFactor: FactorScore;
  factorScores: FactorScore[];
  emotionBuckets: EmotionBucket[];
  keywords: KeywordEvidence[];
  reviewSample: ReviewSnippet[];
}

export interface SummaryPayload {
  title: string;
  description: string;
  question: string;
  className: string;
  advisor: string;
  members: string[];
  qna: Array<{
    question: string;
    answer: string;
  }>;
  metadata: {
    restaurantCount: number;
    factorCount: number;
    graphPointCount: number;
    mapPointCount: number;
    reportCount: number;
  };
}

export interface HbScoresPayload {
  factors: HbFactor[];
  points: HbScorePoint[];
}

export interface WebReportPayload {
  metadata: SummaryPayload["metadata"] & {
    generatedAt: string;
    sourceScorePath: string;
    sourcePointsPath: string;
    sourceLocationsPath: string;
    sourceReviewDir: string;
    emotionBucketCount: number;
  };
  summary: Omit<SummaryPayload, "metadata">;
  factors: HbFactor[];
  restaurants: RestaurantSummary[];
  points: HbScorePoint[];
  reports: RestaurantReport[];
}
