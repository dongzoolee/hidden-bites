import { KakaoMap, type RestaurantLocation } from "@/components/KakaoMap";
import topRestaurantsData from "@/data/top-restaurants-locations.json";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seoul Top 50 Restaurants",
  description: "Distribution of the top 50 restaurants in Seoul on Kakao Map",
};

interface TopRestaurantsData {
  metadata: Record<string, string | number>;
  places: RestaurantLocation[];
}

const data: TopRestaurantsData = topRestaurantsData;

export default function MapPage() {
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
