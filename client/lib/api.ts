import type { HbScoresPayload, RestaurantReport, RestaurantSummary, SummaryPayload } from "@/lib/api-types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchSummary(): Promise<SummaryPayload> {
  return fetchJson<SummaryPayload>("/api/summary");
}

export async function fetchHbScores(): Promise<HbScoresPayload> {
  return fetchJson<HbScoresPayload>("/api/hb-scores");
}

export async function fetchRestaurants(): Promise<RestaurantSummary[]> {
  return fetchJson<RestaurantSummary[]>("/api/restaurants");
}

export async function fetchRestaurantReport(placeId: string): Promise<RestaurantReport> {
  return fetchJson<RestaurantReport>(`/api/restaurants/${encodeURIComponent(placeId)}/report`);
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${path}`);
  }

  return (await response.json()) as T;
}
