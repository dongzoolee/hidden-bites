"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { EmotionBucket, KeywordEvidence, RestaurantReport, ReviewSnippet } from "@/lib/api-types";

interface RestaurantReportPanelProps {
  report: RestaurantReport;
  onExploreAnotherRestaurant: () => void;
}

interface EmotionDisplayBucket {
  id: string;
  label: string;
  chipLabel: string;
  emoji: string;
  koreanLabel: string;
  terms: string[];
  sharePercent: number;
  color: string;
  textColor: string;
}

interface EmotionStyleConfig {
  order: number;
  label: string;
  chipLabel: string;
  koreanLabel: string;
  color: string;
  emoji?: string;
  textColor?: string;
}

const emotionStyleById: Record<string, EmotionStyleConfig> = {
  comfort: {
    order: 0,
    label: "Relieved",
    chipLabel: "Relief",
    koreanLabel: "안도·편안",
    color: "#4d8ccf"
  },
  delight: {
    order: 1,
    label: "Pleasant",
    chipLabel: "Joy",
    koreanLabel: "유쾌·즐거움",
    color: "#ff5a1f"
  },
  surprise: {
    order: 2,
    label: "Curious",
    chipLabel: "Curiosity",
    koreanLabel: "호기심·기대",
    color: "#3da06b"
  },
  friction: {
    order: 3,
    label: "Frustrated",
    chipLabel: "Fatigue",
    koreanLabel: "불만·피로",
    color: "#b87fd9"
  },
  neutral: {
    order: 4,
    label: "Subtle",
    chipLabel: "Subtle",
    koreanLabel: "미미",
    color: "#ffc842",
    textColor: "#1a1310"
  }
};

const fallbackEmotionColors = ["#b22b18", "#ff8fb1", "#4d8ccf", "#3da06b", "#ffc842"];
const graphTickCount = 5;

export function RestaurantReportPanel({ report, onExploreAnotherRestaurant }: RestaurantReportPanelProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<string>(report.keywords[0]?.keyword ?? "");

  useEffect(() => {
    setSelectedKeyword(report.keywords[0]?.keyword ?? "");
  }, [report.placeId, report.keywords]);

  const keywordEvidence = useMemo<KeywordEvidence | null>(
    () => report.keywords.find((keyword) => keyword.keyword === selectedKeyword) ?? report.keywords[0] ?? null,
    [report.keywords, selectedKeyword]
  );
  const selectedSnippets = keywordEvidence?.snippets.length ? keywordEvidence.snippets : report.reviewSample;
  const emotionDisplayBuckets = useMemo(() => buildEmotionDisplayBuckets(report.emotionBuckets), [report.emotionBuckets]);
  const maxEmotionSharePercent = Math.max(...emotionDisplayBuckets.map((bucket) => bucket.sharePercent), 1);
  const graphMaxPercent = Math.ceil(maxEmotionSharePercent / graphTickCount) * graphTickCount;
  const graphTicks = Array.from({ length: graphTickCount + 1 }, (_, index) => graphMaxPercent - (graphMaxPercent / graphTickCount) * index);

  return (
    <div className="selected-report-card" data-testid="selected-report-card">
      <header className="restaurant-report-header">
        <div className="restaurant-report-title">
          <h3>{report.displayPlaceName}</h3>
          <div className="restaurant-report-meta">
            <span>Korean · {formatAddressSummary(report.formattedAddress, report.district)} · since 2017</span>
            <span>{report.popularityCount.toLocaleString()} reviews · 5-yr</span>
          </div>
        </div>
        <div className="restaurant-rating">
          <span aria-label={`${report.googlePlaceRating.toFixed(1)} star rating`}>★★★★★</span>
          <strong>{report.googlePlaceRating.toFixed(1)}</strong>
        </div>
      </header>

      <section className="adjective-section">
        <div className="report-section-heading">
          <h4>The Review Adjectives</h4>
          <p>
            <span>Macro analysis: Categories were defined </span>
            <strong>by selecting the top 10 most frequent adjective</strong>
            <span>s for each emotion.</span>
          </p>
        </div>

        <div className="emotion-chip-row" aria-label="Emotion buckets">
          {emotionDisplayBuckets.map((bucket) => (
            <div className="emotion-chip" key={bucket.id}>
              <i style={{ backgroundColor: bucket.color }} />
              <span>{bucket.chipLabel}</span>
              <strong>
                {bucket.emoji} {bucket.koreanLabel}
              </strong>
            </div>
          ))}
        </div>

        <div className="emotion-graph" aria-label="Emotion category share graph">
          <div className="emotion-graph__header">
            <span>Emotion Graph</span>
            <h5>
              <strong>{formatGraphRestaurantName(report.displayPlaceName)}</strong>
              <span> — category share (%)</span>
              <em>vs all-50 average</em>
            </h5>
          </div>
          <div className="emotion-graph__plot">
            <div className="emotion-graph__axis" aria-hidden="true">
              {graphTicks.map((tick) => (
                <span key={tick}>{formatPercentTick(tick)}</span>
              ))}
            </div>
            <div className="emotion-graph__grid" aria-hidden="true">
              {graphTicks.map((tick) => (
                <span key={tick} />
              ))}
            </div>
            <div className="emotion-graph__bars">
              {emotionDisplayBuckets.map((bucket) => (
                <div className="emotion-graph__column" key={bucket.id}>
                  <div className="emotion-graph__bar-wrap">
                    <div className="emotion-graph__marker" aria-hidden="true" style={buildMarkerStyle(bucket.sharePercent, graphMaxPercent)} />
                    <div
                      className="emotion-graph__bar"
                      style={{
                        backgroundColor: bucket.color,
                        color: bucket.textColor,
                        height: `${Math.max(36, (bucket.sharePercent / graphMaxPercent) * 100)}%`
                      }}
                    >
                      <strong>{bucket.sharePercent.toFixed(1)}</strong>
                    </div>
                  </div>
                  <span>{bucket.emoji}</span>
                  <b>{bucket.label}</b>
                  <em>{bucket.koreanLabel}</em>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="keyword-section">
        <div className="report-section-heading">
          <h4>The Unique & Fun Keywords</h4>
          <p>
            <strong>Click a keyword chip</strong>
            <span> to filter the original reviews that mention it.</span>
          </p>
        </div>
        <div className="keyword-row" aria-label="Keyword filter">
          {report.keywords.map((keyword) => (
            <button
              className={keyword.keyword === keywordEvidence?.keyword ? "keyword-chip keyword-chip--active" : "keyword-chip"}
              key={keyword.keyword}
              type="button"
              onClick={() => setSelectedKeyword(keyword.keyword)}
            >
              {keyword.keyword}
            </button>
          ))}
        </div>
        <div className="snippet-grid" data-testid="snippet-grid">
          {selectedSnippets.slice(0, 4).map((snippet, index) => (
            <blockquote className={`snippet snippet--tone-${(index % 4) + 1}`} key={snippet.sourceReviewId}>
              <p>{snippet.text}</p>
              <footer>{buildKeywordFooter(snippet, report.keywords, keywordEvidence?.keyword ?? null)}</footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="restaurant-explorer" aria-label="Explore another restaurant">
        <button type="button" onClick={onExploreAnotherRestaurant}>
          <span>Explore another restaurant</span>
          <span aria-hidden="true">↑</span>
        </button>
      </section>
    </div>
  );
}

function buildEmotionDisplayBuckets(buckets: EmotionBucket[]): EmotionDisplayBucket[] {
  return buckets
    .map((bucket, index) => {
      const style = emotionStyleById[bucket.id];
      const fallbackColor = fallbackEmotionColors[index % fallbackEmotionColors.length];

      return {
        id: bucket.id,
        label: style?.label ?? bucket.label,
        chipLabel: style?.chipLabel ?? bucket.label,
        emoji: style?.emoji ?? bucket.emoji,
        koreanLabel: style?.koreanLabel ?? bucket.terms.slice(0, 2).join("·"),
        terms: bucket.terms,
        sharePercent: bucket.share * 100,
        color: style?.color ?? fallbackColor,
        textColor: style?.textColor ?? "#fff7e9"
      };
    })
    .sort((left, right) => {
      const leftOrder = emotionStyleById[left.id]?.order ?? 100;
      const rightOrder = emotionStyleById[right.id]?.order ?? 100;

      return leftOrder - rightOrder || right.sharePercent - left.sharePercent || left.label.localeCompare(right.label);
    });
}

function buildMarkerStyle(sharePercent: number, graphMaxPercent: number): CSSProperties {
  return {
    bottom: `${Math.min(100, Math.max(0, (sharePercent / graphMaxPercent) * 100 + 7))}%`
  };
}

function formatAddressSummary(formattedAddress: string, district: string): string {
  const withoutCity = formattedAddress.replace(/^서울특별시\s*/, "");
  const roadMatch = withoutCity.match(/(?:[가-힣]+구\s+)?([가-힣A-Za-z0-9·.\-\s]+(?:로|길)\s*\d+(?:-\d+)?)/);
  const roadAddress = roadMatch?.[1]?.trim();

  if (roadAddress) {
    return `${roadAddress}, ${district}`;
  }

  return district;
}

function formatGraphRestaurantName(displayPlaceName: string): string {
  return displayPlaceName.replace(/점$/, "").trim().toUpperCase();
}

function formatPercentTick(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}%`;
  }

  return `${value.toFixed(1)}%`;
}

function buildKeywordFooter(snippet: ReviewSnippet, keywords: KeywordEvidence[], selectedKeyword: string | null): string {
  const keywordCandidates = keywords.map((keyword) => keyword.keyword);
  const matchedKeywords = keywordCandidates.filter((keyword) => snippet.text.includes(keyword));
  const orderedKeywords = [selectedKeyword, ...matchedKeywords, ...keywordCandidates].filter((keyword): keyword is string => Boolean(keyword));
  const uniqueKeywords = [...new Set(orderedKeywords)].slice(0, 3);

  return `KEYWORD: ${uniqueKeywords.join(" · ")}`;
}
