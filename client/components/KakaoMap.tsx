"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { CustomOverlayMap, Map, MapTypeControl, ZoomControl, useKakaoLoader } from "react-kakao-maps-sdk";
import type { RestaurantSummary } from "@/lib/api-types";
import type { RestaurantSelectionOptions } from "@/lib/selection-types";

interface KakaoMapProps {
  restaurants: RestaurantSummary[];
  selectedPlaceId?: string | null;
  onSelectPlace?: (placeId: string, options?: RestaurantSelectionOptions) => void;
}

const seoulCenter = { lat: 37.5665, lng: 126.978 };

export function KakaoMap({ restaurants, selectedPlaceId = null, onSelectPlace }: KakaoMapProps) {
  const kakaoMapAppKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY ?? "";

  if (!kakaoMapAppKey) {
    return <MapState title="Kakao Map key is missing" body="Set NEXT_PUBLIC_KAKAO_MAP_API_KEY to render the live Seoul map." />;
  }

  return <KakaoMapCanvas appKey={kakaoMapAppKey} restaurants={restaurants} selectedPlaceId={selectedPlaceId} onSelectPlace={onSelectPlace} />;
}

function KakaoMapCanvas({ appKey, restaurants, selectedPlaceId = null, onSelectPlace }: KakaoMapProps & { appKey: string }) {
  const [loading, error] = useKakaoLoader({
    appkey: appKey
  });
  const didFitInitialBoundsRef = useRef(false);
  const [activePlaceId, setActivePlaceId] = useState<string | null>(selectedPlaceId);
  const sortedRestaurants = useMemo(() => [...restaurants].sort((left, right) => left.placeRank - right.placeRank), [restaurants]);
  const currentPlaceId = selectedPlaceId ?? activePlaceId;
  const activeRestaurant = useMemo(
    () => sortedRestaurants.find((restaurant) => restaurant.placeId === currentPlaceId) ?? sortedRestaurants[0] ?? null,
    [currentPlaceId, sortedRestaurants]
  );

  const handleMapCreate = useCallback((map: kakao.maps.Map): void => {
    if (didFitInitialBoundsRef.current) {
      return;
    }

    if (!sortedRestaurants.length) {
      return;
    }

    const bounds = new kakao.maps.LatLngBounds();

    for (const restaurant of sortedRestaurants) {
      bounds.extend(new kakao.maps.LatLng(restaurant.latitude, restaurant.longitude));
    }

    map.setBounds(bounds, 58, 58, 58, 58);
    didFitInitialBoundsRef.current = true;
  }, [sortedRestaurants]);

  function handleRestaurantSelect(placeId: string): void {
    setActivePlaceId(placeId);
    onSelectPlace?.(placeId, { targetHash: "map" });
  }

  if (loading) {
    return <MapState title="Loading Kakao Map" body="Preparing Seoul tiles and restaurant coordinates." />;
  }

  if (error) {
    return <MapState title="Failed to load Kakao Map" body="Check the Kakao JavaScript key and allowed domain settings." />;
  }

  return (
    <div className="kakao-map-shell" data-testid="kakao-map-shell">
      <Map center={seoulCenter} className="kakao-map-canvas" level={8} onCreate={handleMapCreate}>
        <MapTypeControl position="TOPRIGHT" />
        <ZoomControl position="RIGHT" />
        {sortedRestaurants.map((restaurant) => {
          const isSelected = restaurant.placeId === currentPlaceId;
          const markerClassName = ["kakao-map-marker", restaurant.placeRank <= 10 ? "kakao-map-marker--top" : "", isSelected ? "kakao-map-marker--selected" : ""]
            .filter(Boolean)
            .join(" ");

          return (
            <CustomOverlayMap
              clickable
              key={restaurant.placeId}
              position={{ lat: restaurant.latitude, lng: restaurant.longitude }}
              xAnchor={0.5}
              yAnchor={0.5}
              zIndex={isSelected ? 20 : restaurant.placeRank <= 10 ? 12 : 8}
            >
              <button
                aria-label={`${restaurant.placeName} Kakao map rank ${restaurant.placeRank} ${restaurant.district}`}
                className={markerClassName}
                type="button"
                onClick={() => handleRestaurantSelect(restaurant.placeId)}
              >
                <span>{restaurant.placeRank}</span>
              </button>
            </CustomOverlayMap>
          );
        })}
        {activeRestaurant ? (
          <CustomOverlayMap
            clickable
            position={{ lat: activeRestaurant.latitude, lng: activeRestaurant.longitude }}
            xAnchor={0.5}
            yAnchor={1.18}
            zIndex={30}
          >
            <article className="kakao-map-popup">
              <strong>{activeRestaurant.placeName}</strong>
              <span>
                Rank {activeRestaurant.placeRank} · {activeRestaurant.district}
              </span>
              <span>
                Google {activeRestaurant.googlePlaceRating.toFixed(1)} · {activeRestaurant.popularityCount.toLocaleString()} reviews
              </span>
            </article>
          </CustomOverlayMap>
        ) : null}
      </Map>
    </div>
  );
}

function MapState({ title, body }: { title: string; body: string }) {
  return (
    <div className="kakao-map-state" data-testid="kakao-map-state">
      <strong>{title}</strong>
      <span>{body}</span>
    </div>
  );
}
