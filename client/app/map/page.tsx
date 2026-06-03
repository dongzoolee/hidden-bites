import { KakaoMap } from "@/components/KakaoMap";
import topRestaurantsData from "@/data/top-restaurants-locations.json";
import type { RestaurantSummary } from "@/lib/api-types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seoul Top 50 Restaurants",
  description: "Distribution of the top 50 restaurants in Seoul on Kakao Map",
};

interface TopRestaurantsData {
  metadata: Record<string, string | number>;
  places: TopRestaurantLocation[];
}

interface TopRestaurantLocation {
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

const data: TopRestaurantsData = topRestaurantsData;
const restaurants = data.places.map(toRestaurantSummary);

export default function MapPage() {
  return (
    <main className="standalone-map-page">
      <div className="standalone-map-card">
        <h1>Seoul Top 50 Restaurants</h1>
        <p>Based on Google Places user ratings and reviews.</p>
        <div className="standalone-map-legend">
          <span>
            <i className="map-legend__dot map-legend__dot--top" /> Top 10
          </span>
          <span>
            <i className="map-legend__dot map-legend__dot--standard" /> 11-50
          </span>
        </div>
      </div>
      <KakaoMap restaurants={restaurants} />
    </main>
  );
}

function toRestaurantSummary(place: TopRestaurantLocation): RestaurantSummary {
  return {
    placeId: place.place_id,
    placeRank: place.rank,
    placeName: place.name,
    formattedAddress: place.formatted_address,
    googleMapsUri: place.google_maps_uri,
    googlePlaceRating: place.rating,
    popularityCount: place.user_rating_count,
    collectedReviewCount: 0,
    collectionStatus: "location_only",
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    district: place.district,
    topHbScore: 0
  };
}
