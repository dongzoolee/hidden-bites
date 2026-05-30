"use client";

import React, { useState } from "react";
import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";

export interface RestaurantLocation {
  rank: number;
  place_id: string;
  name: string;
  formatted_address: string;
  district: string;
  rating: number;
  user_rating_count: number;
  primary_type: string;
  google_maps_uri: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface KakaoMapProps {
  restaurants: RestaurantLocation[];
}

export function KakaoMap({ restaurants }: KakaoMapProps) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY as string,
  });

  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  if (loading) return <div className="w-full h-[600px] flex items-center justify-center bg-gray-100">Loading Map...</div>;
  if (error) return <div className="w-full h-[600px] flex items-center justify-center bg-red-100 text-red-500">Failed to load Kakao Map</div>;

  return (
    <div className="w-full h-screen min-h-[600px]">
      <Map
        center={{ lat: 37.5665, lng: 126.9780 }} // Center of Seoul
        style={{ width: "100%", height: "100%" }}
        level={8}
      >
        {restaurants.map((restaurant) => {
          const isTop10 = restaurant.rank <= 10;
          return (
            <MapMarker
              key={restaurant.place_id}
              position={{ lat: restaurant.location.latitude, lng: restaurant.location.longitude }}
              image={{
                src: isTop10
                  ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png" // Blue-ish marker for Top 10
                  : "https://t1.daumcdn.net/mapjsapi/images/marker.png", // Default orange/red marker
                size: {
                  width: 24,
                  height: 35
                }
              }}
              onClick={() => setActiveMarkerId(restaurant.place_id)}
            >
              {activeMarkerId === restaurant.place_id && (
                <div style={{ padding: "5px", color: "#000", width: "max-content", fontSize: "12px" }}>
                  <strong>{restaurant.rank}. {restaurant.name}</strong><br />
                  <span>⭐ {restaurant.rating} ({restaurant.user_rating_count})</span><br />
                  <span>{restaurant.district}</span>
                </div>
              )}
            </MapMarker>
          );
        })}
      </Map>
    </div>
  );
}
