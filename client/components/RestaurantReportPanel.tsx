"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { AdjectiveBucket, AdjectiveEvidence, KeywordEvidence, RestaurantReport, ReviewSnippet } from "@/lib/api-types";

interface RestaurantReportPanelProps {
  report: RestaurantReport;
  onExploreAnotherRestaurant: () => void;
}

interface AdjectiveDisplayBucket {
  id: string;
  label: string;
  chipLabel: string;
  emoji: string;
  koreanLabel: string;
  sharePercent: number;
  averageSharePercent: number;
  topAdjectives: AdjectiveEvidence[];
  color: string;
  textColor: string;
}

interface AdjectiveStyleConfig {
  order: number;
  label: string;
  chipLabel: string;
  color: string;
  textColor?: string;
}

const adjectiveStyleById: Record<string, AdjectiveStyleConfig> = {
  "everyday-calm": {
    order: 0,
    label: "Calm",
    chipLabel: "Daily calm",
    color: "#3da06b"
  },
  "positive-gentle": {
    order: 1,
    label: "Warm",
    chipLabel: "Positive",
    color: "#ff5a1f"
  },
  "intense-overwhelming": {
    order: 2,
    label: "Intense",
    chipLabel: "Impact",
    color: "#ffc842",
    textColor: "#1a1310"
  },
  "negative-discomfort": {
    order: 3,
    label: "Friction",
    chipLabel: "Discomfort",
    color: "#b87fd9"
  }
};

const fallbackAdjectiveColors = ["#3da06b", "#ff5a1f", "#ffc842", "#b87fd9"];
const graphTickCount = 5;

export function RestaurantReportPanel({ report, onExploreAnotherRestaurant }: RestaurantReportPanelProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<string>(getDefaultKeyword(report.keywords));

  useEffect(() => {
    setSelectedKeyword(getDefaultKeyword(report.keywords));
  }, [report.placeId, report.keywords]);

  const keywordEvidence = useMemo<KeywordEvidence | null>(
    () => report.keywords.find((keyword) => keyword.keyword === selectedKeyword) ?? report.keywords[0] ?? null,
    [report.keywords, selectedKeyword]
  );
  const selectedSnippets = keywordEvidence?.snippets ?? [];
  const adjectiveDisplayBuckets = useMemo(() => buildAdjectiveDisplayBuckets(report.adjectiveBuckets), [report.adjectiveBuckets]);
  const maxAdjectiveSharePercent = Math.max(
    ...adjectiveDisplayBuckets.flatMap((bucket) => [bucket.sharePercent, bucket.averageSharePercent]),
    1
  );
  const graphMaxPercent = Math.ceil(maxAdjectiveSharePercent / graphTickCount) * graphTickCount;
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
            <span>s for each category.</span>
          </p>
        </div>

        <div className="emotion-chip-row" aria-label="Review adjective buckets">
          {adjectiveDisplayBuckets.map((bucket) => (
            <div className="emotion-chip" key={bucket.id}>
              <i style={{ backgroundColor: bucket.color }} />
              <span>{bucket.chipLabel}</span>
              <strong>
                {bucket.emoji} {bucket.koreanLabel}
              </strong>
              <em>{formatTopAdjectives(bucket.topAdjectives)}</em>
            </div>
          ))}
        </div>

        <div className="emotion-graph" aria-label="Review adjective category share graph">
          <div className="emotion-graph__header">
            <span>Adjective Graph</span>
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
              {adjectiveDisplayBuckets.map((bucket) => (
                <div className="emotion-graph__column" key={bucket.id}>
                  <div className="emotion-graph__bar-wrap">
                    <div className="emotion-graph__marker" aria-hidden="true" style={buildMarkerStyle(bucket.averageSharePercent, graphMaxPercent)} />
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
                  <small>{formatTopAdjectives(bucket.topAdjectives)}</small>
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
            <span> to see original review snippets behind each high-signal keyword.</span>
          </p>
        </div>
        <div className="keyword-row" aria-label="Review keyword filter">
          {report.keywords.map((keyword) => (
            <button
              aria-pressed={keyword.keyword === keywordEvidence?.keyword}
              className={keyword.keyword === keywordEvidence?.keyword ? "keyword-chip keyword-chip--active" : "keyword-chip"}
              key={keyword.keyword}
              type="button"
              onClick={() => setSelectedKeyword(keyword.keyword)}
            >
              <span>{keyword.keyword}</span>
              <strong>{keyword.count}</strong>
            </button>
          ))}
        </div>
        {keywordEvidence ? (
          <div className="keyword-summary">
            <strong>{keywordEvidence.count.toLocaleString()} keyword hits</strong>
            <span>score {keywordEvidence.score.toFixed(1)}</span>
          </div>
        ) : null}
        {selectedSnippets.length > 0 && keywordEvidence ? (
          <div className="snippet-grid" data-testid="snippet-grid">
            {selectedSnippets.map((snippet, index) => (
              <blockquote
                className={`snippet snippet--tone-${(index % 4) + 1}`}
                key={snippet.sourceReviewId}
              >
                <p>{snippet.text}</p>
                <footer>{buildKeywordFooter(snippet, keywordEvidence)}</footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <div className="keyword-empty" data-testid="keyword-empty">
            <strong>해당 original review 없음</strong>
            <span>{keywordEvidence?.keyword ?? "Keyword"} matched 0 reviews for this restaurant.</span>
          </div>
        )}
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

function getDefaultKeyword(keywords: KeywordEvidence[]): string {
  return keywords[0]?.keyword ?? "";
}

function buildAdjectiveDisplayBuckets(buckets: AdjectiveBucket[]): AdjectiveDisplayBucket[] {
  return buckets
    .map((bucket, index) => {
      const style = adjectiveStyleById[bucket.id];
      const fallbackColor = fallbackAdjectiveColors[index % fallbackAdjectiveColors.length];

      return {
        id: bucket.id,
        label: style?.label ?? bucket.label,
        chipLabel: style?.chipLabel ?? bucket.label,
        emoji: bucket.emoji,
        koreanLabel: bucket.koreanLabel,
        sharePercent: bucket.share * 100,
        averageSharePercent: bucket.averageShare * 100,
        topAdjectives: bucket.topAdjectives,
        color: style?.color ?? fallbackColor,
        textColor: style?.textColor ?? "#fff7e9"
      };
    })
    .sort((left, right) => {
      const leftOrder = adjectiveStyleById[left.id]?.order ?? 100;
      const rightOrder = adjectiveStyleById[right.id]?.order ?? 100;

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

function formatTopAdjectives(adjectives: AdjectiveEvidence[]): string {
  const topAdjectives = adjectives.slice(0, 2).map((adjective) => adjective.adjective);

  return topAdjectives.length > 0 ? topAdjectives.join(" · ") : "No mapped adjective";
}

function buildKeywordFooter(snippet: ReviewSnippet, keyword: KeywordEvidence): string {
  const rating = snippet.rating === null ? "No rating" : `${snippet.rating.toFixed(1)} stars`;
  const relativeTime = snippet.relativeTime ?? "Google Maps review";

  return `KEYWORD: ${keyword.keyword} · ${rating} · ${relativeTime}`;
}
