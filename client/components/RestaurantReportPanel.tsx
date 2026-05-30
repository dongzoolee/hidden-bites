"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeywordEvidence, RestaurantReport } from "@/lib/api-types";

interface RestaurantReportPanelProps {
  report: RestaurantReport;
}

export function RestaurantReportPanel({ report }: RestaurantReportPanelProps) {
  const [selectedKeyword, setSelectedKeyword] = useState<string>(report.keywords[0]?.keyword ?? "");

  useEffect(() => {
    setSelectedKeyword(report.keywords[0]?.keyword ?? "");
  }, [report.placeId, report.keywords]);

  const keywordEvidence = useMemo<KeywordEvidence | null>(() => report.keywords.find((keyword) => keyword.keyword === selectedKeyword) ?? report.keywords[0] ?? null, [report.keywords, selectedKeyword]);
  const maxFactorScore = Math.max(...report.factorScores.map((score) => score.hbScore), 1);

  return (
    <div className="report-grid">
      <section className="report-pane report-pane--summary">
        <p className="pane-label">HB position</p>
        <div className="report-score">
          <span>{report.topFactor.hbScore.toFixed(2)}</span>
          <strong>{report.topFactor.factorLabel}</strong>
        </div>
        <p>
          Google {report.googlePlaceRating.toFixed(1)} · {report.popularityCount.toLocaleString()} public reviews · {report.collectedReviewCount.toLocaleString()} collected reviews
        </p>
        <p>{report.formattedAddress}</p>
      </section>

      <section className="report-pane report-pane--factors">
        <p className="pane-label">Factor profile</p>
        <div className="factor-bars">
          {report.factorScores.map((factor) => (
            <div className="factor-bar" key={factor.factorId}>
              <span>{factor.factorLabel}</span>
              <div className="factor-bar__track">
                <div className="factor-bar__value" style={{ width: `${Math.max(4, (factor.hbScore / maxFactorScore) * 100)}%` }} />
              </div>
              <strong>{factor.hbScore.toFixed(2)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="report-pane report-pane--emotion">
        <p className="pane-label">The Review Adjectives</p>
        <div className="emotion-stack">
          {report.emotionBuckets.map((bucket) => (
            <div className="emotion-column" key={bucket.id}>
              <div className="emotion-column__bar" style={{ height: `${Math.max(12, bucket.share * 210)}px` }} />
              <span className="emotion-column__emoji">{bucket.emoji}</span>
              <strong>{bucket.label}</strong>
              <span>{Math.round(bucket.share * 100)}%</span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-pane report-pane--keywords">
        <p className="pane-label">The Unique Keywords</p>
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
          {(keywordEvidence?.snippets ?? report.reviewSample).map((snippet) => (
            <blockquote className="snippet" key={snippet.sourceReviewId}>
              <p>{snippet.text}</p>
              <footer>
                {snippet.author}
                {snippet.rating ? ` · ${snippet.rating.toFixed(1)}` : ""}
                {snippet.relativeTime ? ` · ${snippet.relativeTime}` : ""}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  );
}
