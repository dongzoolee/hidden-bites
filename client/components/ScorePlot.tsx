"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { HbFactor, HbScorePoint } from "@/lib/api-types";
import type { RestaurantSelectionOptions } from "@/lib/selection-types";

export type ScoreMode = "scatter" | "list";

export interface FactorWeight {
  factorId: string;
  label: string;
  weight: number;
}

interface ScorePlotProps {
  factors: HbFactor[];
  points: HbScorePoint[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string, options?: ScorePlotSelectionOptions) => void;
}

export type ScorePlotSelectionOptions = RestaurantSelectionOptions;

interface PlotRestaurantScore {
  placeId: string;
  placeName: string;
  displayPlaceName: string;
  placeRank: number;
  googlePlaceRating: number;
  popularityCount: number;
  collectedReviewCount: number;
  factorScore: number;
  factorIndex: number;
  weightedScore: number;
  chartScore: number;
  x: number;
  y: number;
  factorScores: Record<string, number>;
}

interface ScoreAccumulator {
  placeId: string;
  placeName: string;
  displayPlaceName: string;
  placeRank: number;
  googlePlaceRating: number;
  popularityCount: number;
  collectedReviewCount: number;
  factorScore: number;
  totalScore: number;
  factorCount: number;
  factorScores: Record<string, number>;
}

interface TooltipState {
  x: number;
  y: number;
  rank: number;
  score: PlotRestaurantScore;
}

interface NumericDomain {
  min: number;
  max: number;
}

interface CalloutPosition {
  left: number;
  top: number;
}

const chart = {
  width: 784,
  height: 500,
  left: 35,
  top: 39,
  plotWidth: 736,
  plotHeight: 409
};

const chartScoreDomain: NumericDomain = {
  min: 4.83,
  max: 4.96
};

const xTickValues = [0, 25, 50, 75, 100];
const yTickLabels = ["4.96", "4.93", "4.90", "4.87", "4.83"];
const defaultWeightPattern = [70, 40, 50, 90, 50, 30, 30, 30, 30, 30];
const evaluationColors = ["#ff5a1f", "#3da06b", "#ffc842", "#b87fd9", "#4d8ccf", "#ff8fb1"];

export function ScorePlot({ factors, points, selectedPlaceId, onSelectPlace }: ScorePlotProps) {
  const [selectedFactorId, setSelectedFactorId] = useState<string>(factors[0]?.id ?? "");
  const [scoreMode, setScoreMode] = useState<ScoreMode>("scatter");
  const [factorWeights, setFactorWeights] = useState<FactorWeight[]>(() => buildDefaultWeights(factors));
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const selectedFactor = useMemo(() => factors.find((factor) => factor.id === selectedFactorId) ?? factors[0] ?? null, [factors, selectedFactorId]);
  const activeFactorId = selectedFactor?.id ?? factors[0]?.id ?? "";
  const factorMaxScores = useMemo(() => buildFactorMaxScores(points), [points]);
  const plotScores = useMemo(() => buildPlotScores(points, activeFactorId, factorWeights), [activeFactorId, factorWeights, points]);
  const dotScores = useMemo(() => [...plotScores].sort((left, right) => left.chartScore - right.chartScore), [plotScores]);
  const topScore = plotScores[0] ?? null;
  const selectedScore = useMemo(
    () => plotScores.find((score) => score.placeId === selectedPlaceId) ?? topScore,
    [plotScores, selectedPlaceId, topScore]
  );
  const topCalloutPosition = topScore ? buildCalloutPosition(topScore) : null;

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

  function handleFactorCycle(): void {
    if (factors.length === 0) {
      return;
    }

    const currentIndex = Math.max(
      0,
      factors.findIndex((factor) => factor.id === activeFactorId)
    );
    const nextFactor = factors[(currentIndex + 1) % factors.length];
    setTooltip(null);
    setSelectedFactorId(nextFactor.id);
  }

  return (
    <div className="score-lab" data-testid="score-lab">
      <section className="score-graph-card" aria-label="HB score graph">
        <div className="score-toolbar" aria-label="Score view controls">
          <div className="score-mode-toggle" role="group" aria-label="Score mode toggle">
            <button
              className={scoreMode === "scatter" ? "score-mode-button score-mode-button--active" : "score-mode-button"}
              type="button"
              onClick={() => setScoreMode("scatter")}
            >
              ◎ Scatter
            </button>
            <button
              className={scoreMode === "list" ? "score-mode-button score-mode-button--active" : "score-mode-button"}
              type="button"
              onClick={() => setScoreMode("list")}
            >
              ≡ Ranked list
            </button>
          </div>
          <button className="score-axis-selector" type="button" aria-label="Change x-axis factor" onClick={handleFactorCycle}>
            x: {selectedFactor?.label ?? "Taste"} →
          </button>
        </div>

        <div className="score-graph-content">
          <h3>HB score Graph</h3>

          {scoreMode === "scatter" ? (
            <div className="score-graph-plot" data-testid="score-chart">
              <svg aria-label="HB score scatter plot" role="img" viewBox={`0 0 ${chart.width} ${chart.height}`}>
                {yTickLabels.map((label, index) => {
                  const y = yTickScale(index);

                  return (
                    <g key={label}>
                      <line className="score-grid-line" x1={chart.left} x2={chart.left + chart.plotWidth} y1={y} y2={y} />
                      <text className="score-axis-label score-axis-label--y" x={chart.left - 10} y={y + 5}>
                        {label}
                      </text>
                    </g>
                  );
                })}

                {xTickValues.map((tick) => {
                  const x = xScale(tick);

                  return (
                    <g key={tick}>
                      <line className="score-grid-line" x1={x} x2={x} y1={chart.top} y2={chart.top + chart.plotHeight} />
                      <text className="score-axis-label score-axis-label--x" x={x} y={chart.top + chart.plotHeight + 34}>
                        {tick}
                      </text>
                    </g>
                  );
                })}

                <line className="score-axis-line" x1={chart.left} x2={chart.left} y1={chart.top} y2={chart.top + chart.plotHeight} />
                <line className="score-axis-line" x1={chart.left} x2={chart.left + chart.plotWidth} y1={chart.top + chart.plotHeight} y2={chart.top + chart.plotHeight} />

                {dotScores.map((score) => {
                  const isSelected = score.placeId === selectedPlaceId;
                  const isTopPick = score.placeId === topScore?.placeId;

                  return (
                    <circle
                      aria-label={`${score.displayPlaceName} ${selectedFactor?.label ?? "Factor"} index ${score.factorIndex.toFixed(0)} HB score ${score.chartScore.toFixed(2)}`}
                      className={buildScoreDotClassName(isSelected, isTopPick)}
                      cx={score.x}
                      cy={score.y}
                      key={score.placeId}
                      r={isSelected ? 6.5 : 5.5}
                      role="button"
                      tabIndex={0}
                      onBlur={() => setTooltip(null)}
                      onClick={() => handleReportSelection(score.placeId)}
                      onFocus={() => setTooltip({ x: score.x, y: score.y, rank: plotScores.findIndex((item) => item.placeId === score.placeId) + 1, score })}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleReportSelection(score.placeId);
                        }
                      }}
                      onMouseEnter={() => setTooltip({ x: score.x, y: score.y, rank: plotScores.findIndex((item) => item.placeId === score.placeId) + 1, score })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </svg>

              {topScore && topCalloutPosition ? (
                <div className="score-top-callout" style={buildPositionStyle(topCalloutPosition)}>
                  <span aria-hidden="true">👑</span>
                  <strong>{topScore.displayPlaceName}</strong>
                </div>
              ) : null}

              {tooltip ? (
                <div className="score-tooltip" style={{ left: `${(tooltip.x / chart.width) * 100}%`, top: `${(tooltip.y / chart.height) * 100}%` }}>
                  <strong>{tooltip.score.displayPlaceName}</strong>
                  <span>Rank {tooltip.rank}</span>
                  <span>
                    {selectedFactor?.label ?? "Factor"} index {tooltip.score.factorIndex.toFixed(0)}
                  </span>
                  <span>HB score {tooltip.score.chartScore.toFixed(2)}</span>
                </div>
              ) : null}
            </div>
          ) : (
            <ol className="score-ranked-list" aria-label="HB score ranked list">
              {plotScores.map((score, index) => (
                <li className={score.placeId === selectedPlaceId ? "score-ranked-list__row score-ranked-list__row--active" : "score-ranked-list__row"} key={score.placeId}>
                  <button type="button" onClick={() => handleReportSelection(score.placeId)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{score.displayPlaceName}</strong>
                    <em>{score.chartScore.toFixed(2)}</em>
                    <b>{score.factorIndex.toFixed(0)}</b>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className="score-graph-instructions">hover for the full name · click a dot to inspect it below</p>
      </section>

      <aside className="score-control-stack" aria-label="Score controls and top pick">
        <section className="score-controls" aria-label="Score controls">
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
        </section>

        <section className="top-pick-card" aria-label="Top pick right now">
          <span>→ Top pick right now</span>
          <strong>{topScore?.displayPlaceName ?? "No restaurant"}</strong>
          <b>{topScore ? formatDisplayScore(topScore.chartScore) : "0.0"}</b>
        </section>
      </aside>

      <section className="evaluation-card" aria-label="Selected restaurant weighted evaluation">
        <div className="evaluation-card__header">
          <div>
            <span>Individual evaluation</span>
            <h3>{selectedScore?.displayPlaceName ?? "Select a restaurant"}</h3>
            <p>
              {selectedScore
                ? `Rank #${selectedScore.placeRank} of 50 · Google baseline ${selectedScore.googlePlaceRating.toFixed(1)}★`
                : "Pick a dot or list row to inspect its factor profile."}
            </p>
          </div>
          <strong className="evaluation-card__score">
            ★{selectedScore?.chartScore.toFixed(2) ?? "0.00"}
            <small>HB re-score</small>
          </strong>
        </div>

        <div className="evaluation-factor-grid">
          {factorWeights.slice(0, 6).map((factorWeight, index) => {
            const factorScore = selectedScore?.factorScores[factorWeight.factorId] ?? 0;
            const maxFactorScore = factorMaxScores.get(factorWeight.factorId) ?? Math.max(factorScore, 1);
            const factorPercent = maxFactorScore > 0 ? clamp((factorScore / maxFactorScore) * 100, 0, 100) : 0;

            return (
              <div className="evaluation-factor" key={factorWeight.factorId} style={buildFactorColorStyle(evaluationColors[index] ?? "#ff5a1f")}>
                <span>{factorWeight.label}</span>
                <div className="evaluation-factor__track">
                  <div className="evaluation-factor__value" style={{ width: `${Math.max(4, factorPercent)}%` }} />
                </div>
                <em>
                  factor {factorPercent.toFixed(0)} / 100 · your weight {factorWeight.weight}
                </em>
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

function buildPlotScores(points: HbScorePoint[], selectedFactorId: string, factorWeights: FactorWeight[]): PlotRestaurantScore[] {
  const scoreRows = new Map<string, ScoreAccumulator>();
  const selectedFactorScores = points.filter((point) => point.factorId === selectedFactorId).map((point) => point.hbScore);
  const selectedFactorScoreDomain = buildFactorScoreDomain(selectedFactorScores);
  const weightsByFactorId = new Map(factorWeights.map((factorWeight) => [factorWeight.factorId, factorWeight.weight]));

  for (const point of points) {
    const current = scoreRows.get(point.placeId);
    const nextScore: ScoreAccumulator = current ?? {
      placeId: point.placeId,
      placeName: point.placeName,
      displayPlaceName: point.displayPlaceName,
      placeRank: point.placeRank,
      googlePlaceRating: point.googlePlaceRating,
      popularityCount: point.popularityCount,
      collectedReviewCount: point.collectedReviewCount,
      factorScore: 0,
      totalScore: 0,
      factorCount: 0,
      factorScores: {}
    };

    nextScore.factorScores[point.factorId] = point.hbScore;
    nextScore.totalScore += point.hbScore;
    nextScore.factorCount += 1;

    if (point.factorId === selectedFactorId) {
      nextScore.factorScore = point.hbScore;
    }

    scoreRows.set(point.placeId, nextScore);
  }

  const weightedRows = [...scoreRows.values()]
    .filter((score) => selectedFactorId === "" || score.factorScores[selectedFactorId] !== undefined)
    .map((score) => ({
      score,
      weightedScore: buildWeightedScore(score, weightsByFactorId)
    }));
  const sourceDomain = buildChartScoreSourceDomain(weightedRows.map((row) => row.weightedScore));

  return weightedRows
    .map(({ score, weightedScore }) => {
      const factorIndex = buildFactorIndex(score.factorScore, selectedFactorScoreDomain);
      const chartScore = scaleToDomain(weightedScore, sourceDomain, chartScoreDomain);

      return {
        placeId: score.placeId,
        placeName: score.placeName,
        displayPlaceName: score.displayPlaceName,
        placeRank: score.placeRank,
        googlePlaceRating: score.googlePlaceRating,
        popularityCount: score.popularityCount,
        collectedReviewCount: score.collectedReviewCount,
        factorScore: score.factorScore,
        factorIndex,
        weightedScore,
        chartScore,
        x: xScale(factorIndex),
        y: yScale(chartScore),
        factorScores: score.factorScores
      };
    })
    .sort((left, right) => right.chartScore - left.chartScore || right.factorIndex - left.factorIndex || left.placeRank - right.placeRank || left.displayPlaceName.localeCompare(right.displayPlaceName));
}

function buildWeightedScore(score: ScoreAccumulator, weightsByFactorId: Map<string, number>): number {
  let weightedTotal = 0;
  let weightTotal = 0;

  for (const [factorId, factorScore] of Object.entries(score.factorScores)) {
    const weight = weightsByFactorId.get(factorId) ?? 0;
    weightedTotal += factorScore * weight;
    weightTotal += weight;
  }

  if (weightTotal > 0) {
    return weightedTotal / weightTotal;
  }

  return score.factorCount > 0 ? score.totalScore / score.factorCount : 0;
}

function buildFactorMaxScores(points: HbScorePoint[]): Map<string, number> {
  const maxScores = new Map<string, number>();

  for (const point of points) {
    const currentMax = maxScores.get(point.factorId) ?? 0;
    maxScores.set(point.factorId, Math.max(currentMax, point.hbScore));
  }

  return maxScores;
}

function buildChartScoreSourceDomain(scores: number[]): NumericDomain {
  if (scores.length === 0) {
    return {
      min: 0,
      max: 1
    };
  }

  const min = Math.min(...scores);
  const max = Math.max(...scores);

  if (max - min < 0.0001) {
    return {
      min: Math.max(0, min - 1),
      max: max + 1
    };
  }

  return { min, max };
}

function buildFactorScoreDomain(scores: number[]): NumericDomain {
  if (scores.length === 0) {
    return {
      min: 0,
      max: 1
    };
  }

  const min = Math.min(...scores);
  const max = Math.max(...scores);

  if (max - min < 0.0001) {
    return {
      min: Math.max(0, min - 1),
      max: max + 1
    };
  }

  return { min, max };
}

function buildFactorIndex(factorScore: number, sourceDomain: NumericDomain): number {
  const progress = (factorScore - sourceDomain.min) / Math.max(sourceDomain.max - sourceDomain.min, 0.0001);

  return 35 + clamp(progress, 0, 1) * 65;
}

function scaleToDomain(value: number, sourceDomain: NumericDomain, targetDomain: NumericDomain): number {
  const progress = (value - sourceDomain.min) / Math.max(sourceDomain.max - sourceDomain.min, 0.0001);

  return targetDomain.min + clamp(progress, 0, 1) * (targetDomain.max - targetDomain.min);
}

function buildScoreDotClassName(isSelected: boolean, isTopPick: boolean): string {
  return ["score-dot", isTopPick ? "score-dot--top-pick" : "", isSelected ? "score-dot--selected" : ""].filter(Boolean).join(" ");
}

function buildCalloutPosition(score: PlotRestaurantScore): CalloutPosition {
  return {
    left: clamp((score.x / chart.width) * 100, 30, 92),
    top: clamp((score.y / chart.height) * 100 - 8, 5, 80)
  };
}

function buildPositionStyle(position: CalloutPosition): CSSProperties {
  return {
    left: `${position.left}%`,
    top: `${position.top}%`
  };
}

function buildFactorColorStyle(color: string): CSSProperties & { "--factor-color": string } {
  return {
    "--factor-color": color
  };
}

function formatDisplayScore(chartScore: number): string {
  return (chartScore * 15).toFixed(1);
}

function xScale(value: number): number {
  return chart.left + (clamp(value, 0, 100) / 100) * chart.plotWidth;
}

function yScale(score: number): number {
  const clampedScore = clamp(score, chartScoreDomain.min, chartScoreDomain.max);

  return chart.top + ((chartScoreDomain.max - clampedScore) / Math.max(chartScoreDomain.max - chartScoreDomain.min, 0.0001)) * chart.plotHeight;
}

function yTickScale(index: number): number {
  return chart.top + (chart.plotHeight / Math.max(yTickLabels.length - 1, 1)) * index;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
