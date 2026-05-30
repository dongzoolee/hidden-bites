"use client";

import { useMemo, useState } from "react";
import type { RestaurantSummary } from "@/lib/api-types";

interface SeoulRestaurantMapProps {
  restaurants: RestaurantSummary[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
}

interface TooltipState {
  x: number;
  y: number;
  restaurant: RestaurantSummary;
}

interface ProjectedPoint {
  x: number;
  y: number;
}

interface DistrictCount {
  district: string;
  count: number;
}

const mapChart = {
  width: 920,
  height: 520,
  left: 52,
  top: 34,
  right: 42,
  bottom: 42
};

const seoulBounds = {
  minLongitude: 126.74,
  maxLongitude: 127.22,
  minLatitude: 37.4,
  maxLatitude: 37.72
};

const seoulOutline: Array<[number, number]> = [
  [126.764, 37.482],
  [126.776, 37.56],
  [126.812, 37.62],
  [126.882, 37.678],
  [126.964, 37.704],
  [127.058, 37.698],
  [127.146, 37.654],
  [127.184, 37.586],
  [127.176, 37.508],
  [127.126, 37.444],
  [127.026, 37.428],
  [126.936, 37.438],
  [126.842, 37.452]
];

const hanRiver: Array<[number, number]> = [
  [126.792, 37.558],
  [126.846, 37.548],
  [126.902, 37.535],
  [126.964, 37.524],
  [127.024, 37.518],
  [127.082, 37.522],
  [127.146, 37.536],
  [127.19, 37.556]
];

const placeLabels = [
  { label: "Hongdae", longitude: 126.92, latitude: 37.555 },
  { label: "Myeongdong", longitude: 126.985, latitude: 37.563 },
  { label: "Gangnam", longitude: 127.048, latitude: 37.502 },
  { label: "Seongsu", longitude: 127.044, latitude: 37.546 },
  { label: "Itaewon", longitude: 126.994, latitude: 37.533 }
];

export function SeoulRestaurantMap({ restaurants, selectedPlaceId, onSelectPlace }: SeoulRestaurantMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const plotWidth = mapChart.width - mapChart.left - mapChart.right;
  const plotHeight = mapChart.height - mapChart.top - mapChart.bottom;
  const sortedRestaurants = useMemo(() => [...restaurants].sort((left, right) => left.placeRank - right.placeRank), [restaurants]);
  const districtCounts = useMemo<DistrictCount[]>(() => {
    const counts = new Map<string, number>();

    for (const restaurant of restaurants) {
      counts.set(restaurant.district, (counts.get(restaurant.district) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([district, count]) => ({ district, count }))
      .sort((left, right) => right.count - left.count || left.district.localeCompare(right.district))
      .slice(0, 7);
  }, [restaurants]);
  const maxDistrictCount = Math.max(...districtCounts.map((row) => row.count), 1);

  return (
    <div className="map-workspace">
      <div className="map-chart" data-testid="seoul-map-chart">
        <svg aria-label="Seoul top restaurant dot distribution graph" role="img" viewBox={`0 0 ${mapChart.width} ${mapChart.height}`}>
          <polygon className="seoul-outline" points={toSvgPoints(seoulOutline, plotWidth, plotHeight)} />
          <polyline className="han-river han-river--wide" points={toSvgPoints(hanRiver, plotWidth, plotHeight)} />
          <polyline className="han-river" points={toSvgPoints(hanRiver, plotWidth, plotHeight)} />

          {placeLabels.map((place) => {
            const projected = projectPoint(place.longitude, place.latitude, plotWidth, plotHeight);

            return (
              <text className="map-region-label" key={place.label} x={projected.x} y={projected.y}>
                {place.label}
              </text>
            );
          })}

          {sortedRestaurants.map((restaurant) => {
            const projected = projectPoint(restaurant.longitude, restaurant.latitude, plotWidth, plotHeight);
            const isSelected = restaurant.placeId === selectedPlaceId;
            const isTopRank = restaurant.placeRank <= 10;
            const className = ["map-dot", isTopRank ? "map-dot--top" : "", isSelected ? "map-dot--selected" : ""].filter(Boolean).join(" ");

            return (
              <circle
                aria-label={`${restaurant.placeName} Seoul map rank ${restaurant.placeRank} ${restaurant.district}`}
                className={className}
                cx={projected.x}
                cy={projected.y}
                key={restaurant.placeId}
                r={isSelected ? 7.4 : isTopRank ? 5.9 : 4.5}
                role="button"
                tabIndex={0}
                onBlur={() => setTooltip(null)}
                onClick={() => onSelectPlace(restaurant.placeId)}
                onFocus={() => setTooltip({ x: projected.x, y: projected.y, restaurant })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectPlace(restaurant.placeId);
                  }
                }}
                onMouseEnter={() => setTooltip({ x: projected.x, y: projected.y, restaurant })}
                onMouseLeave={() => setTooltip(null)}
              />
            );
          })}
        </svg>

        {tooltip ? (
          <div className="map-tooltip" style={{ left: `${(tooltip.x / mapChart.width) * 100}%`, top: `${(tooltip.y / mapChart.height) * 100}%` }}>
            <strong>{tooltip.restaurant.placeName}</strong>
            <span>
              Rank {tooltip.restaurant.placeRank} · {tooltip.restaurant.district}
            </span>
            <span>
              Google {tooltip.restaurant.googlePlaceRating.toFixed(1)} · {tooltip.restaurant.popularityCount.toLocaleString()} reviews
            </span>
          </div>
        ) : null}
      </div>

      <aside className="map-districts" aria-label="Top restaurant district count">
        <p className="pane-label">District count</p>
        <div className="map-district-list">
          {districtCounts.map((row) => (
            <div className="map-district-row" key={row.district}>
              <span>{row.district}</span>
              <strong>{row.count}</strong>
              <div className="map-district-track">
                <div className="map-district-value" style={{ width: `${Math.max(6, (row.count / maxDistrictCount) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function projectPoint(longitude: number, latitude: number, plotWidth: number, plotHeight: number): ProjectedPoint {
  const x = mapChart.left + ((longitude - seoulBounds.minLongitude) / (seoulBounds.maxLongitude - seoulBounds.minLongitude)) * plotWidth;
  const y = mapChart.top + ((seoulBounds.maxLatitude - latitude) / (seoulBounds.maxLatitude - seoulBounds.minLatitude)) * plotHeight;

  return { x, y };
}

function toSvgPoints(points: Array<[number, number]>, plotWidth: number, plotHeight: number): string {
  return points
    .map(([longitude, latitude]) => {
      const projected = projectPoint(longitude, latitude, plotWidth, plotHeight);

      return `${projected.x.toFixed(1)},${projected.y.toFixed(1)}`;
    })
    .join(" ");
}
