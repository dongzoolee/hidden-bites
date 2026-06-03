"use client";

import { ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { KeywordEvidence, RestaurantReport, RestaurantSummary } from "@/lib/api-types";

interface RestaurantReportPanelProps {
  report: RestaurantReport;
  restaurants: RestaurantSummary[];
  onSelectPlace: (placeId: string) => void;
}

const emotionColors = ["#4c93d7", "#ff5530", "#3fa56e", "#b67be8", "#ffc83d", "#f77da4"];

export function RestaurantReportPanel({ report, restaurants, onSelectPlace }: RestaurantReportPanelProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<string>(report.keywords[0]?.keyword ?? "");

  useEffect(() => {
    setSelectedKeyword(report.keywords[0]?.keyword ?? "");
  }, [report.placeId, report.keywords]);

  const keywordEvidence = useMemo<KeywordEvidence | null>(
    () => report.keywords.find((keyword) => keyword.keyword === selectedKeyword) ?? report.keywords[0] ?? null,
    [report.keywords, selectedKeyword]
  );
  const selectedSnippets = keywordEvidence?.snippets.length ? keywordEvidence.snippets : report.reviewSample;
  const maxEmotionShare = Math.max(...report.emotionBuckets.map((bucket) => bucket.share), 0.01);

  return (
    <div className="selected-report-card" data-testid="selected-report-card">
      <header className="restaurant-report-header">
        <div>
          <p className="micro-label">Korean · {report.district} · since 2017</p>
          <h3>{report.displayPlaceName}</h3>
          <p>{report.formattedAddress}</p>
        </div>
        <div className="restaurant-rating">
          <span>5-star Google rating</span>
          <strong>{report.googlePlaceRating.toFixed(1)}</strong>
          <em>{report.popularityCount.toLocaleString()} reviews · 5-yr</em>
          <a href={report.googleMapsUri} target="_blank" rel="noreferrer" aria-label={`${report.displayPlaceName} Google Maps`}>
            <ExternalLink aria-hidden="true" size={16} />
          </a>
        </div>
      </header>

      <section className="adjective-section">
        <div className="report-section-heading">
          <h4>The Review Adjectives</h4>
          <p>Macro analysis: extracted adjectives from reviews and pattern NLI emotion analysis on extracted adjectives.</p>
        </div>

        <div className="emotion-chip-row" aria-label="Emotion buckets">
          {report.emotionBuckets.map((bucket, index) => (
            <div className="emotion-chip" key={bucket.id} style={{ borderTopColor: emotionColors[index % emotionColors.length] }}>
              <span>{bucket.label}</span>
              <strong>{bucket.emoji} {bucket.terms.slice(0, 2).join(" · ")}</strong>
            </div>
          ))}
        </div>

        <div className="emotion-graph" aria-label="Emotion category share graph">
          {report.emotionBuckets.map((bucket, index) => {
            const height = Math.max(38, (bucket.share / maxEmotionShare) * 188);

            return (
              <div className="emotion-graph__column" key={bucket.id}>
                <div className="emotion-graph__marker" aria-hidden="true" />
                <div
                  className="emotion-graph__bar"
                  style={{
                    backgroundColor: emotionColors[index % emotionColors.length],
                    height: `${height}px`
                  }}
                >
                  <strong>{Math.round(bucket.share * 100)}</strong>
                </div>
                <span>{bucket.emoji}</span>
                <b>{bucket.label}</b>
                <em>{bucket.terms[0] ?? bucket.id}</em>
              </div>
            );
          })}
        </div>
      </section>

      <section className="keyword-section">
        <div className="report-section-heading">
          <h4>The Unique & Fun Keywords</h4>
          <p>Click a keyword chip to filter the original reviews that mention it.</p>
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
              <footer>
                KEYWORD · {snippet.author}
                {snippet.rating ? ` · ${snippet.rating.toFixed(1)}` : ""}
                {snippet.relativeTime ? ` · ${snippet.relativeTime}` : ""}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section className="restaurant-explorer" aria-label="Explore another restaurant">
        <label htmlFor="restaurant-report-select">Explore another restaurant</label>
        <select
          className="restaurant-select"
          id="restaurant-report-select"
          value={report.placeId}
          onChange={(event) => onSelectPlace(event.target.value)}
        >
          {restaurants.map((restaurant) => (
            <option key={restaurant.placeId} value={restaurant.placeId}>
              {restaurant.displayPlaceName}
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}
