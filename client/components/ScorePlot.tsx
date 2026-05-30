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
  const [activeFactorId, setActiveFactorId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const plotWidth = chart.width - chart.left - chart.right;
  const plotHeight = chart.height - chart.top - chart.bottom;
  const yTicks = [5, 4, 3, 2, 1, 0];
  const visiblePoints = useMemo(() => points.filter((point) => !activeFactorId || point.factorId === activeFactorId), [activeFactorId, points]);

  return (
    <div className="score-workspace">
      <div className="factor-filter" aria-label="Factor filter">
        <button className={!activeFactorId ? "factor-filter__button factor-filter__button--active" : "factor-filter__button"} type="button" onClick={() => setActiveFactorId(null)}>
          All
        </button>
        {factors.map((factor) => (
          <button
            className={activeFactorId === factor.id ? "factor-filter__button factor-filter__button--active" : "factor-filter__button"}
            key={factor.id}
            type="button"
            onClick={() => setActiveFactorId(factor.id)}
          >
            {factor.label}
          </button>
        ))}
      </div>

      <div className="score-chart" data-testid="score-chart">
        <svg aria-label="HB score scatter plot" role="img" viewBox={`0 0 ${chart.width} ${chart.height}`}>
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

          {factors.map((factor) => {
            const x = xScale(factor.order, factors.length, plotWidth);

            return (
              <g key={factor.id}>
                <line className="factor-line" x1={x} x2={x} y1={chart.top} y2={chart.top + plotHeight} />
                <text className="factor-label" x={x} y={chart.top + plotHeight + 34}>
                  {factor.label}
                </text>
              </g>
            );
          })}

          {visiblePoints.map((point) => {
            const x = xScale(point.factorOrder, factors.length, plotWidth) + jitter(point.placeId, 16);
            const y = yScale(point.hbScore, plotHeight);
            const isSelected = point.placeId === selectedPlaceId;

            return (
              <circle
                aria-label={`${point.placeName} ${point.factorLabel} ${point.hbScore.toFixed(2)}`}
                className={isSelected ? "score-dot score-dot--selected" : "score-dot"}
                cx={x}
                cy={y}
                key={`${point.placeId}-${point.factorId}`}
                r={isSelected ? 7 : 4.5}
                role="button"
                tabIndex={0}
                onBlur={() => setTooltip(null)}
                onClick={() => onSelectPlace(point.placeId)}
                onFocus={() => setTooltip({ x, y, point })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectPlace(point.placeId);
                  }
                }}
                onMouseEnter={() => setTooltip({ x, y, point })}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </svg>

        {tooltip ? (
          <div className="score-tooltip" style={{ left: `${(tooltip.x / chart.width) * 100}%`, top: `${(tooltip.y / chart.height) * 100}%` }}>
            <strong>{tooltip.point.placeName}</strong>
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

function xScale(order: number, factorCount: number, plotWidth: number): number {
  return chart.left + (order / Math.max(factorCount - 1, 1)) * plotWidth;
}

function yScale(score: number, plotHeight: number): number {
  return chart.top + ((5 - score) / 5) * plotHeight;
}

function jitter(value: string, magnitude: number): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }

  return (hash / 997 - 0.5) * magnitude;
}
