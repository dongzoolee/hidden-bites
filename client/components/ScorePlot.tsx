"use client";

import { useMemo, useState } from "react";
import type { HbFactor, HbScorePoint } from "@/lib/api-types";

interface ScorePlotProps {
  factors: HbFactor[];
  points: HbScorePoint[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
}

interface TooltipState {
  x: number;
  y: number;
  rank: number;
  point: HbScorePoint;
}

const chart = {
  width: 920,
  height: 520,
  left: 86,
  top: 36,
  right: 34,
  bottom: 82
};

export function ScorePlot({ factors, points, selectedPlaceId, onSelectPlace }: ScorePlotProps) {
  const [selectedFactorId, setSelectedFactorId] = useState<string>(factors[0]?.id ?? "");
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const yTicks = [5, 4, 3, 2, 1, 0];
  const selectedFactor = useMemo(() => factors.find((factor) => factor.id === selectedFactorId) ?? factors[0] ?? null, [factors, selectedFactorId]);
  const selectedFactorPoints = useMemo(() => {
    if (!selectedFactor) {
      return [];
    }

    return points
      .filter((point) => point.factorId === selectedFactor.id)
      .sort((left, right) => right.hbScore - left.hbScore || left.placeRank - right.placeRank || left.placeName.localeCompare(right.placeName));
  }, [points, selectedFactor]);
  const rankGuides = useMemo(() => Array.from({ length: selectedFactorPoints.length }, (_, index) => index), [selectedFactorPoints.length]);

  return (
    <div className="score-workspace">
      <div className="score-chart" data-testid="score-chart">
        <svg aria-label="HB score rank scatter plot" role="img" viewBox={`0 0 ${chart.width} ${chart.height}`}>
          <line className="axis-line" x1={chart.left} x2={chart.left} y1={chart.top} y2={chart.top + plotHeight} />
          <line className="axis-line" x1={chart.left} x2={chart.left + plotWidth} y1={chart.top + plotHeight} y2={chart.top + plotHeight} />

          {yTicks.map((tick) => {
            const y = yScale(tick, plotHeight);

            return (
              <g key={tick}>
                <line className="grid-line" x1={chart.left} x2={chart.left + plotWidth} y1={y} y2={y} />
                <text className="axis-label" x={chart.left - 18} y={y + 4}>
                  {tick.toFixed(1)}
                </text>
              </g>
            );
          })}

          {rankGuides.map((rankIndex) => {
            const x = xScaleByRank(rankIndex, selectedFactorPoints.length, plotWidth);
            const isMajorGuide = rankIndex % 5 === 0 || rankIndex === rankGuides.length - 1;

            return (
              <g key={rankIndex}>
                <line className={isMajorGuide ? "rank-line rank-line--major" : "rank-line"} x1={x} x2={x} y1={chart.top} y2={chart.top + plotHeight} />
                {isMajorGuide ? (
                  <text className="rank-label" x={x} y={chart.top + plotHeight + 34}>
                    {rankIndex + 1}
                  </text>
                ) : null}
              </g>
            );
          })}

          {selectedFactorPoints.map((point, index) => {
            const x = xScaleByRank(index, selectedFactorPoints.length, plotWidth);
            const y = yScale(point.hbScore, plotHeight);
            const isSelected = point.placeId === selectedPlaceId;

            return (
              <circle
                aria-label={`${point.placeName} ${point.factorLabel} rank ${index + 1} ${point.hbScore.toFixed(2)}`}
                className={isSelected ? "score-dot score-dot--selected" : "score-dot"}
                cx={x}
                cy={y}
                key={`${point.placeId}-${point.factorId}`}
                r={isSelected ? 7 : 4.5}
                role="button"
                tabIndex={0}
                onBlur={() => setTooltip(null)}
                onClick={() => onSelectPlace(point.placeId)}
                onFocus={() => setTooltip({ x, y, rank: index + 1, point })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectPlace(point.placeId);
                  }
                }}
                onMouseEnter={() => setTooltip({ x, y, rank: index + 1, point })}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </svg>

        {selectedFactor ? (
          <select
            aria-label="X-axis factor"
            className="factor-select"
            value={selectedFactor.id}
            onChange={(event) => {
              setSelectedFactorId(event.target.value);
              setTooltip(null);
            }}
          >
            {factors.map((factor) => (
              <option key={factor.id} value={factor.id}>
                {factor.label}
              </option>
            ))}
          </select>
        ) : null}

        {tooltip ? (
          <div className="score-tooltip" style={{ left: `${(tooltip.x / chart.width) * 100}%`, top: `${(tooltip.y / chart.height) * 100}%` }}>
            <strong>{tooltip.point.placeName}</strong>
            <span>Rank {tooltip.rank}</span>
            <span>
              {tooltip.point.factorLabel}: {tooltip.point.hbScore.toFixed(2)}
            </span>
            <span>Google {tooltip.point.googlePlaceRating.toFixed(1)} · {tooltip.point.popularityCount.toLocaleString()} reviews</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function xScaleByRank(index: number, pointCount: number, plotWidth: number): number {
  return chart.left + (index / Math.max(pointCount - 1, 1)) * plotWidth;
}

function yScale(score: number, plotHeight: number): number {
  return chart.top + ((5 - score) / 5) * plotHeight;
}
