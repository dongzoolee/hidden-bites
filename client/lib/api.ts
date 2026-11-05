import type { HbScoresPayload, RestaurantReport, RestaurantSummary, SummaryPayload } from "@/lib/api-types";

const dataBasePath = "/data";

export async function fetchSummary(): Promise<SummaryPayload> {
  return fetchJson<SummaryPayload>("summary.json");
}

export async function fetchHbScores(): Promise<HbScoresPayload> {
  return fetchJson<HbScoresPayload>("hb-scores.json");
}

export async function fetchRestaurants(): Promise<RestaurantSummary[]> {
  return fetchJson<RestaurantSummary[]>("restaurants.json");
}

export async function fetchRestaurantReport(placeId: string): Promise<RestaurantReport> {
  return fetchJson<RestaurantReport>(`reports/${encodeURIComponent(placeId)}.json`);
}

async function fetchJson<T>(path: string): Promise<T> {
  const url = `${dataBasePath}/${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`);
  }

  return (await response.json()) as T;
}
