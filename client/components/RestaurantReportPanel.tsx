"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { AdjectiveBucket, AdjectiveEvidence, FunnyKeywordEvidence, FunnyKeywordSnippet, RestaurantReport } from "@/lib/api-types";

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
  const [selectedFunnyKeywordId, setSelectedFunnyKeywordId] = useState<string>(getDefaultFunnyKeywordId(report.funnyKeywords));

  useEffect(() => {
    setSelectedFunnyKeywordId(getDefaultFunnyKeywordId(report.funnyKeywords));
  }, [report.placeId, report.funnyKeywords]);

  const funnyKeywordEvidence = useMemo<FunnyKeywordEvidence | null>(
    () => report.funnyKeywords.find((keyword) => keyword.id === selectedFunnyKeywordId) ?? report.funnyKeywords[0] ?? null,
    [report.funnyKeywords, selectedFunnyKeywordId]
  );
  const selectedFunnySnippets = funnyKeywordEvidence?.snippets ?? [];
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

        <div className="emotion-graph" aria-label="Review emotion category share graph">
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
            <strong>Click a funny category chip</strong>
            <span> to see original reviews that match its curated expression set.</span>
          </p>
        </div>
        <div className="keyword-row" aria-label="Funny keyword category filter">
          {report.funnyKeywords.map((keyword) => (
            <button
              aria-pressed={keyword.id === funnyKeywordEvidence?.id}
              className={keyword.id === funnyKeywordEvidence?.id ? "keyword-chip keyword-chip--active" : "keyword-chip"}
              key={keyword.id}
              style={buildFunnyKeywordChipStyle(keyword, keyword.id === funnyKeywordEvidence?.id)}
              type="button"
              onClick={() => setSelectedFunnyKeywordId(keyword.id)}
            >
              <span>{keyword.label}</span>
              <strong>{keyword.reviewCount}</strong>
            </button>
          ))}
        </div>
        {funnyKeywordEvidence ? (
          <div className="funny-keyword-summary">
            <strong>{funnyKeywordEvidence.reviewCount.toLocaleString()} original reviews</strong>
            <span>{funnyKeywordEvidence.matchCount.toLocaleString()} matched expressions</span>
          </div>
        ) : null}
        {selectedFunnySnippets.length > 0 && funnyKeywordEvidence ? (
          <div className="snippet-grid" data-testid="snippet-grid">
            {selectedFunnySnippets.map((snippet) => (
              <blockquote
                className="snippet snippet--funny"
                key={snippet.sourceReviewId}
                style={buildFunnyKeywordSnippetStyle(funnyKeywordEvidence.color)}
              >
                <p>{snippet.text}</p>
                <footer>{buildFunnyKeywordFooter(snippet, funnyKeywordEvidence)}</footer>
              </blockquote>
            ))}
          </div>
        ) : (
          <div className="funny-keyword-empty" data-testid="funny-keyword-empty">
            <strong>해당 original review 없음</strong>
            <span>{funnyKeywordEvidence?.label ?? "Funny keyword"} matched 0 reviews for this restaurant.</span>
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

function getDefaultFunnyKeywordId(funnyKeywords: FunnyKeywordEvidence[]): string {
  return (funnyKeywords.find((keyword) => keyword.reviewCount > 0) ?? funnyKeywords[0])?.id ?? "";
}

function buildFunnyKeywordChipStyle(keyword: FunnyKeywordEvidence, isActive: boolean): CSSProperties {
  if (isActive) {
    return {
      backgroundColor: keyword.color,
      borderColor: keyword.color,
      color: getReadableTextColor(keyword.color)
    };
  }

  return {
    borderColor: keyword.color
  };
}

function buildFunnyKeywordSnippetStyle(color: string): CSSProperties {
  return {
    backgroundColor: color,
    color: getReadableTextColor(color)
  };
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

function buildFunnyKeywordFooter(snippet: FunnyKeywordSnippet, keyword: FunnyKeywordEvidence): string {
  return `CATEGORY: ${keyword.label} · MATCH: ${snippet.matchedTerms.slice(0, 5).join(" · ")}`;
}

function getReadableTextColor(hexColor: string): string {
  const normalized = hexColor.replace("#", "");

  if (!/^[0-9a-f]{6}$/i.test(normalized)) {
    return "#fff7e9";
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "#1a1310" : "#fff7e9";
}
