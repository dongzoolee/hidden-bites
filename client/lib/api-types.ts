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

export interface FunnyKeywordSnippet extends ReviewSnippet {
  matchedTerms: string[];
}

export interface FunnyKeywordEvidence {
  id: string;
  label: string;
  color: string;
  terms: string[];
  reviewCount: number;
  matchCount: number;
  snippets: FunnyKeywordSnippet[];
}

export interface AdjectiveEvidence {
  adjective: string;
  count: number;
}

export interface AdjectiveBucket {
  id: string;
  label: string;
  emoji: string;
  count: number;
  share: number;
  averageShare: number;
  koreanLabel: string;
  topAdjectives: AdjectiveEvidence[];
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
  adjectiveBuckets: AdjectiveBucket[];
  keywords: KeywordEvidence[];
  funnyKeywords: FunnyKeywordEvidence[];
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
