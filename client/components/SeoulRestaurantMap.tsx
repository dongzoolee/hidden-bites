"use client";

import { useMemo } from "react";
import { KakaoMap } from "@/components/KakaoMap";
import type { RestaurantSummary } from "@/lib/api-types";
import type { RestaurantSelectionOptions } from "@/lib/selection-types";

interface SeoulRestaurantMapProps {
  restaurants: RestaurantSummary[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string, options?: RestaurantSelectionOptions) => void;
}

interface DistrictCount {
  district: string;
  count: number;
}

const districtColors = ["#191713", "#ff5530", "#4c93d7", "#9d2b1f", "#3fa56e", "#f77da4", "#ffc83d"];

export function SeoulRestaurantMap({ restaurants, selectedPlaceId, onSelectPlace }: SeoulRestaurantMapProps) {
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
      <div className="map-chart map-chart--kakao" aria-label="Seoul top restaurant Kakao map dot distribution" data-testid="seoul-map-chart">
        <KakaoMap restaurants={restaurants} selectedPlaceId={selectedPlaceId} onSelectPlace={onSelectPlace} />
        <div className="map-legend" aria-label="Kakao map dot legend">
          <span>
            <i className="map-legend__dot map-legend__dot--top" />
            Top 10
          </span>
          <span>
            <i className="map-legend__dot map-legend__dot--standard" />
            Rank 11-50
          </span>
          <span>
            <i className="map-legend__dot map-legend__dot--selected" />
            Selected
          </span>
        </div>
      </div>

      <aside className="map-districts" aria-label="Top restaurant district count">
        <h3>Dot distribution analysis</h3>
        <p>The Kakao map shows the top-50 restaurants as real Seoul coordinates, revealing tight clusters around search-heavy districts.</p>
        <div className="map-district-list">
          {districtCounts.map((row, index) => (
            <div className="map-district-row" key={row.district}>
              <span>{row.district}</span>
              <div className="map-district-track">
                <div
                  className="map-district-value"
                  style={{
                    backgroundColor: districtColors[index % districtColors.length],
                    width: `${Math.max(8, (row.count / maxDistrictCount) * 100)}%`
                  }}
                />
              </div>
              <strong>{row.count}</strong>
            </div>
          ))}
        </div>
        <p className="map-note">Dense review zones suggest where Top 50 visibility is produced, not only taste quality.</p>
      </aside>
    </div>
  );
}
