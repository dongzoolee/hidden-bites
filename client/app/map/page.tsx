import React from "react";
import fs from "fs";
import path from "path";
import { KakaoMap, RestaurantLocation } from "@/components/KakaoMap";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seoul Top 50 Restaurants",
  description: "Distribution of the top 50 restaurants in Seoul on Kakao Map",
};

// JSON 파일의 구조체 타입 정의
interface TopRestaurantsData {
  metadata: Record<string, unknown>;
  places: RestaurantLocation[];
}

export default async function MapPage() {
  // 서버 컴포넌트에서 파일 시스템을 통해 데이터를 로드합니다.
  const dataPath = path.join(process.cwd(), "..", "datasets", "google-places-seoul-top-restaurants-2026-05-15-locations.json");
  const fileContent = fs.readFileSync(dataPath, "utf-8");
  const data: TopRestaurantsData = JSON.parse(fileContent);

  return (
    <main className="w-full h-screen">
      <div className="absolute top-4 left-4 z-10 bg-white p-4 rounded-lg shadow-md max-w-sm">
        <h1 className="text-xl font-bold mb-2">Seoul Top 50 Restaurants</h1>
        <p className="text-sm text-gray-600 mb-2">
          Based on Google Places user ratings and reviews.
        </p>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span> Top 10
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-orange-500 rounded-full inline-block"></span> 11-50
          </span>
        </div>
      </div>
      <KakaoMap restaurants={data.places} />
    </main>
  );
}
