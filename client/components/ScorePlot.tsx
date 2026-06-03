"use client";

import { useEffect, useMemo, useState } from "react";
import type { HbFactor, HbScorePoint } from "@/lib/api-types";
import type { RestaurantSelectionOptions } from "@/lib/selection-types";

export type ScoreMode = "scatter" | "list";

export interface FactorWeight {
  factorId: string;
  label: string;
  weight: number;
}

interface WeightedRestaurantScore {
  placeId: string;
  placeName: string;
  displayPlaceName: string;
  placeRank: number;
  googlePlaceRating: number;
  popularityCount: number;
  collectedReviewCount: number;
  weightedScore: number;
  selectedFactorScore: number;
  factorScores: Record<string, number>;
}

interface ScorePlotProps {
  factors: HbFactor[];
  points: HbScorePoint[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string, options?: ScorePlotSelectionOptions) => void;
}

export type ScorePlotSelectionOptions = RestaurantSelectionOptions;

interface TooltipState {
  x: number;
  y: number;
  rank: number;
  score: WeightedRestaurantScore;
}

const chart = {
  width: 920,
  height: 500,
  left: 76,
  top: 44,
  right: 42,
  bottom: 70
};

const defaultWeightPattern = [90, 82, 74, 66, 58, 50, 44, 38, 34, 30];

export function ScorePlot({ factors, points, selectedPlaceId, onSelectPlace }: ScorePlotProps) {
  const [selectedFactorId, setSelectedFactorId] = useState<string>(factors[0]?.id ?? "");
  const [scoreMode, setScoreMode] = useState<ScoreMode>("scatter");
  const [factorWeights, setFactorWeights] = useState<FactorWeight[]>(() => buildDefaultWeights(factors));
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const selectedFactor = useMemo(() => factors.find((factor) => factor.id === selectedFactorId) ?? factors[0] ?? null, [factors, selectedFactorId]);
  const weightedScores = useMemo(
    () => buildWeightedScores(points, factorWeights, selectedFactor?.id ?? factors[0]?.id ?? ""),
    [factorWeights, factors, points, selectedFactor]
  );
  const selectedScore = useMemo(
    () => weightedScores.find((score) => score.placeId === selectedPlaceId) ?? weightedScores[0] ?? null,
    [selectedPlaceId, weightedScores]
  );
  const topScore = weightedScores[0] ?? null;
  const yDomain = useMemo(() => buildYDomain(weightedScores), [weightedScores]);
  const yTicks = useMemo(() => buildYTicks(yDomain), [yDomain]);

  useEffect(() => {
    setFactorWeights((currentWeights) => syncFactorWeights(currentWeights, factors));
  }, [factors]);

  useEffect(() => {
    if (!selectedFactorId && factors[0]) {
      setSelectedFactorId(factors[0].id);
      return;
    }

    if (selectedFactorId && !factors.some((factor) => factor.id === selectedFactorId)) {
      setSelectedFactorId(factors[0]?.id ?? "");
    }
  }, [factors, selectedFactorId]);

  function handleWeightChange(factorId: string, weight: number): void {
    setFactorWeights((currentWeights) =>
      currentWeights.map((factorWeight) => (factorWeight.factorId === factorId ? { ...factorWeight, weight } : factorWeight))
    );
  }

  function handleReportSelection(placeId: string): void {
    setTooltip(null);
    onSelectPlace(placeId, { scrollToReport: true, targetHash: "report" });
  }

  function handleGoToReportClick(): void {
    if (selectedScore) {
      handleReportSelection(selectedScore.placeId);
    }
  }

  return (
    <div className="score-lab" data-testid="score-lab">
      <div className="score-stage">
        <div className="score-toolbar" aria-label="Score view controls">
          <div className="score-mode-toggle" role="group" aria-label="Score mode toggle">
            <button className={scoreMode === "scatter" ? "mini-pill mini-pill--active" : "mini-pill"} type="button" onClick={() => setScoreMode("scatter")}>
              Scatter
            </button>
            <button className={scoreMode === "list" ? "mini-pill mini-pill--active" : "mini-pill"} type="button" onClick={() => setScoreMode("list")}>
              Ranked list
            </button>
          </div>
          <p className="chart-axis-note">X: {selectedFactor?.label ?? "Factor"} · Y: HB score</p>
        </div>

        {scoreMode === "scatter" ? (
          <div className="score-chart" data-testid="score-chart">
            <svg aria-label="HB score rank scatter plot" role="img" viewBox={`0 0 ${chart.width} ${chart.height}`}>
              <line className="axis-line" x1={chart.left} x2={chart.left} y1={chart.top} y2={chart.top + plotHeight} />
              <line className="axis-line" x1={chart.left} x2={chart.left + plotWidth} y1={chart.top + plotHeight} y2={chart.top + plotHeight} />

              {yTicks.map((tick) => {
                const y = yScale(tick, plotHeight, yDomain);

                return (
                  <g key={tick}>
                    <line className="grid-line" x1={chart.left} x2={chart.left + plotWidth} y1={y} y2={y} />
                    <text className="axis-label" x={chart.left - 18} y={y + 4}>
                      {tick.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {weightedScores.map((score, index) => {
                const x = xScaleByRank(index, weightedScores.length, plotWidth);
                const y = yScale(score.selectedFactorScore, plotHeight, yDomain);
                const isSelected = score.placeId === selectedPlaceId;
                const isTopPick = score.placeId === topScore?.placeId;

                return (
                  <circle
                    aria-label={`${score.displayPlaceName} weighted rank ${index + 1} ${score.selectedFactorScore.toFixed(2)}`}
                    className={buildScoreDotClassName(isSelected, isTopPick)}
                    cx={x}
                    cy={y}
                    key={score.placeId}
                    r={isSelected ? 7.4 : isTopPick ? 6.6 : 4.2}
                    role="button"
                    tabIndex={0}
                    onBlur={() => setTooltip(null)}
                    onClick={() => handleReportSelection(score.placeId)}
                    onFocus={() => setTooltip({ x, y, rank: index + 1, score })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleReportSelection(score.placeId);
                      }
                    }}
                    onMouseEnter={() => setTooltip({ x, y, rank: index + 1, score })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
            </svg>

            {tooltip ? (
              <div className="score-tooltip" style={{ left: `${(tooltip.x / chart.width) * 100}%`, top: `${(tooltip.y / chart.height) * 100}%` }}>
                <strong>{tooltip.score.displayPlaceName}</strong>
                <span>Weighted rank {tooltip.rank}</span>
                <span>
                  {selectedFactor?.label ?? "Factor"}: {tooltip.score.selectedFactorScore.toFixed(2)}
                </span>
                <span>Weighted score {(tooltip.score.weightedScore * 20).toFixed(1)}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <ol className="score-list" aria-label="Weighted restaurant ranking">
            {weightedScores.slice(0, 12).map((score, index) => (
              <li className={score.placeId === selectedPlaceId ? "score-list__row score-list__row--active" : "score-list__row"} key={score.placeId}>
                <button type="button" onClick={() => handleReportSelection(score.placeId)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{score.displayPlaceName}</strong>
                  <em>{(score.weightedScore * 20).toFixed(1)}</em>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      <aside className="score-controls" aria-label="Score controls">
        <h3>Score controls</h3>
        <p className="control-label">X-axis factor</p>
        <div className="factor-chip-grid">
          {factors.map((factor) => (
            <button
              className={factor.id === selectedFactor?.id ? "factor-chip factor-chip--active" : "factor-chip"}
              key={factor.id}
              type="button"
              onClick={() => {
                setSelectedFactorId(factor.id);
                setTooltip(null);
              }}
            >
              {factor.label}
            </button>
          ))}
        </div>

        <p className="control-label">Factor weights</p>
        <div className="factor-weight-list">
          {factorWeights.map((factorWeight) => (
            <label className="factor-weight" key={factorWeight.factorId}>
              <span>{factorWeight.label}</span>
              <input
                aria-label={`${factorWeight.label} weight`}
                className="factor-weight-slider"
                max={100}
                min={0}
                type="range"
                value={factorWeight.weight}
                onChange={(event) => handleWeightChange(factorWeight.factorId, Number(event.target.value))}
              />
              <strong>{factorWeight.weight}</strong>
            </label>
          ))}
        </div>

        <div className="top-pick-card">
          <span>Top pick right now</span>
          <strong>{topScore?.displayPlaceName ?? "No restaurant"}</strong>
          <b>{topScore ? (topScore.weightedScore * 20).toFixed(1) : "0.0"}</b>
        </div>
      </aside>

      <section className="evaluation-card" aria-label="Selected restaurant weighted evaluation">
        <div>
          <span>Individual evaluation</span>
          <h3>{selectedScore?.displayPlaceName ?? "Select a restaurant"}</h3>
          <p>
            {selectedScore
              ? `Rank #${selectedScore.placeRank} · Google ${selectedScore.googlePlaceRating.toFixed(1)} · ${selectedScore.popularityCount.toLocaleString()} reviews`
              : "Pick a dot or list row to inspect its factor profile."}
          </p>
        </div>
        <strong className="evaluation-card__score">★ {selectedScore?.selectedFactorScore.toFixed(2) ?? "0.00"}</strong>
        <div className="evaluation-factor-grid">
          {factorWeights.slice(0, 6).map((factorWeight) => {
            const factorScore = selectedScore?.factorScores[factorWeight.factorId] ?? 0;

            return (
              <div className="evaluation-factor" key={factorWeight.factorId}>
                <span>{factorWeight.label}</span>
                <div className="evaluation-factor__track">
                  <div className="evaluation-factor__value" style={{ width: `${Math.max(4, (factorScore / 5) * 100)}%` }} />
                </div>
                <em>factor {factorScore.toFixed(2)} · weight {factorWeight.weight}</em>
              </div>
            );
          })}
        </div>
        <button className="report-jump" type="button" disabled={!selectedScore} onClick={handleGoToReportClick}>
          Go to Report
          <span aria-hidden="true">↓</span>
        </button>
      </section>
    </div>
  );
}

function buildDefaultWeights(factors: HbFactor[]): FactorWeight[] {
  return factors.map((factor, index) => ({
    factorId: factor.id,
    label: factor.label,
    weight: defaultWeightPattern[index] ?? 30
  }));
}

function syncFactorWeights(currentWeights: FactorWeight[], factors: HbFactor[]): FactorWeight[] {
  const currentById = new Map(currentWeights.map((factorWeight) => [factorWeight.factorId, factorWeight.weight]));

  return factors.map((factor, index) => ({
    factorId: factor.id,
    label: factor.label,
    weight: currentById.get(factor.id) ?? defaultWeightPattern[index] ?? 30
  }));
}

function buildWeightedScores(points: HbScorePoint[], factorWeights: FactorWeight[], selectedFactorId: string): WeightedRestaurantScore[] {
  const weightsByFactorId = new Map(factorWeights.map((factorWeight) => [factorWeight.factorId, factorWeight.weight]));
  const scoreRows = new Map<string, WeightedRestaurantScore>();

  for (const point of points) {
    const current = scoreRows.get(point.placeId);
    const nextScore: WeightedRestaurantScore = current ?? {
      placeId: point.placeId,
      placeName: point.placeName,
      displayPlaceName: point.displayPlaceName,
      placeRank: point.placeRank,
      googlePlaceRating: point.googlePlaceRating,
      popularityCount: point.popularityCount,
      collectedReviewCount: point.collectedReviewCount,
      weightedScore: 0,
      selectedFactorScore: 0,
      factorScores: {}
    };

    nextScore.factorScores[point.factorId] = point.hbScore;
    scoreRows.set(point.placeId, nextScore);
  }

  return [...scoreRows.values()]
    .map((score) => {
      let weightedTotal = 0;
      let weightTotal = 0;

      for (const [factorId, factorScore] of Object.entries(score.factorScores)) {
        const weight = weightsByFactorId.get(factorId) ?? 0;
        weightedTotal += factorScore * weight;
        weightTotal += weight;
      }

      return {
        ...score,
        weightedScore: weightTotal > 0 ? weightedTotal / weightTotal : 0,
        selectedFactorScore: score.factorScores[selectedFactorId] ?? 0
      };
    })
    .sort((left, right) => right.weightedScore - left.weightedScore || left.placeRank - right.placeRank || left.displayPlaceName.localeCompare(right.displayPlaceName));
}

function buildScoreDotClassName(isSelected: boolean, isTopPick: boolean): string {
  return ["score-dot", isTopPick ? "score-dot--top-pick" : "", isSelected ? "score-dot--selected" : ""].filter(Boolean).join(" ");
}

function xScaleByRank(index: number, pointCount: number, plotWidth: number): number {
  return chart.left + (index / Math.max(pointCount - 1, 1)) * plotWidth;
}

function buildYDomain(scores: WeightedRestaurantScore[]): { min: number; max: number } {
  const scoreValues = scores.map((score) => score.selectedFactorScore);
  const minScore = Math.min(...scoreValues, 0);
  const maxScore = Math.max(...scoreValues, 1);
  const paddedMin = Math.max(0, Math.floor((minScore - 0.1) * 10) / 10);
  const paddedMax = Math.min(5, Math.ceil((maxScore + 0.1) * 10) / 10);

  if (paddedMax - paddedMin < 1) {
    return {
      min: Math.max(0, paddedMax - 1),
      max: paddedMax
    };
  }

  return {
    min: paddedMin,
    max: paddedMax
  };
}

function buildYTicks(domain: { min: number; max: number }): number[] {
  return Array.from({ length: 5 }, (_, index) => domain.max - ((domain.max - domain.min) / 4) * index);
}

function yScale(score: number, plotHeight: number, domain: { min: number; max: number }): number {
  const clampedScore = Math.min(domain.max, Math.max(domain.min, score));

  return chart.top + ((domain.max - clampedScore) / Math.max(domain.max - domain.min, 1)) * plotHeight;
}
