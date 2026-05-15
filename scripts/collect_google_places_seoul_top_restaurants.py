from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"
TEXT_SEARCH_ENTERPRISE_UNIT_COST_USD = 0.035
PLACE_DETAILS_ENTERPRISE_UNIT_COST_USD = 0.020
DEFAULT_MAX_TEXT_SEARCH_REQUESTS = 110
DEFAULT_MAX_PLACE_DETAILS_REQUESTS = 0
DEFAULT_BUDGET_USD = 5.0
SEOUL_RECTANGLE = {
    "low": {"latitude": 37.413294, "longitude": 126.734086},
    "high": {"latitude": 37.715133, "longitude": 127.269311},
}
TEXT_SEARCH_FIELD_MASK = ",".join(
    [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.businessStatus",
        "places.rating",
        "places.userRatingCount",
        "places.types",
        "places.primaryType",
        "places.googleMapsUri",
        "nextPageToken",
    ]
)
SEOUL_GU_NAMES = [
    "강남구",
    "강동구",
    "강북구",
    "강서구",
    "관악구",
    "광진구",
    "구로구",
    "금천구",
    "노원구",
    "도봉구",
    "동대문구",
    "동작구",
    "마포구",
    "서대문구",
    "서초구",
    "성동구",
    "성북구",
    "송파구",
    "양천구",
    "영등포구",
    "용산구",
    "은평구",
    "종로구",
    "중구",
    "중랑구",
]
GU_TERMS = ["맛집", "식당", "한식", "고기집"]
SEOUL_WIDE_QUERIES = [
    "서울 맛집",
    "서울 식당",
    "서울 한식",
    "서울 고기집",
    "서울 일식",
    "서울 중식",
    "서울 양식",
    "서울 국밥",
    "서울 라멘",
    "서울 파스타",
]
FOOD_TYPES = {
    "restaurant",
    "food",
    "meal_takeaway",
    "meal_delivery",
    "barbecue_restaurant",
    "korean_restaurant",
    "japanese_restaurant",
    "chinese_restaurant",
    "italian_restaurant",
    "american_restaurant",
    "asian_restaurant",
    "seafood_restaurant",
    "steak_house",
    "hamburger_restaurant",
    "ramen_restaurant",
    "sushi_restaurant",
}


@dataclass(frozen=True)
class QuerySpec:
    text_query: str
    group: str


class CollectionError(RuntimeError):
    def __init__(self, message: str, places_by_id: dict[str, dict[str, Any]], request_count: int) -> None:
        super().__init__(message)
        self.places_by_id = places_by_id
        self.request_count = request_count


def load_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}

    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def build_query_plan() -> list[QuerySpec]:
    gu_queries = [
        QuerySpec(text_query=f"서울 {gu_name} {term}", group=f"gu:{gu_name}")
        for gu_name in SEOUL_GU_NAMES
        for term in GU_TERMS
    ]
    wide_queries = [QuerySpec(text_query=query, group="seoul") for query in SEOUL_WIDE_QUERIES]
    return gu_queries + wide_queries


def estimate_cost(max_text_search_requests: int, max_place_details_requests: int) -> float:
    return round(
        (max_text_search_requests * TEXT_SEARCH_ENTERPRISE_UNIT_COST_USD)
        + (max_place_details_requests * PLACE_DETAILS_ENTERPRISE_UNIT_COST_USD),
        4,
    )


def ensure_budget(max_text_search_requests: int, max_place_details_requests: int, budget_usd: float) -> None:
    estimated_cost = estimate_cost(max_text_search_requests, max_place_details_requests)
    if estimated_cost > budget_usd:
        raise ValueError(
            f"Estimated maximum cost ${estimated_cost:.2f} exceeds budget ${budget_usd:.2f}. "
            "Lower request caps before executing."
        )


def build_text_search_payload(query: str) -> dict[str, Any]:
    return {
        "textQuery": query,
        "includedType": "restaurant",
        "strictTypeFiltering": True,
        "minRating": 4.5,
        "pageSize": 20,
        "languageCode": "ko",
        "regionCode": "KR",
        "locationRestriction": {"rectangle": SEOUL_RECTANGLE},
    }


def post_json(api_key: str, url: str, payload: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": TEXT_SEARCH_FIELD_MASK,
    }
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")

    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                response_body = response.read().decode("utf-8")
                return json.loads(response_body)
        except urllib.error.HTTPError as error:
            error_body = error.read().decode("utf-8", errors="replace")
            if error.code in {429, 500, 502, 503, 504} and attempt < 3:
                time.sleep(attempt * 1.5)
                continue
            raise RuntimeError(f"Google Places request failed with HTTP {error.code}: {error_body}") from error
        except urllib.error.URLError as error:
            if attempt < 3:
                time.sleep(attempt * 1.5)
                continue
            raise RuntimeError(f"Google Places request failed: {error}") from error

    raise RuntimeError("Google Places request failed after retries.")


def display_name_text(place: dict[str, Any]) -> str:
    display_name = place.get("displayName")
    if isinstance(display_name, dict):
        text = display_name.get("text")
        if isinstance(text, str):
            return text
    return ""


def normalize_place(place: dict[str, Any], query: QuerySpec) -> dict[str, Any] | None:
    place_id = place.get("id")
    if not isinstance(place_id, str) or not place_id:
        return None

    rating = place.get("rating")
    user_rating_count = place.get("userRatingCount")
    formatted_address = place.get("formattedAddress")
    business_status = place.get("businessStatus")
    primary_type = place.get("primaryType")
    google_maps_uri = place.get("googleMapsUri")
    types = place.get("types")

    return {
        "place_id": place_id,
        "name": display_name_text(place),
        "formatted_address": formatted_address if isinstance(formatted_address, str) else "",
        "business_status": business_status if isinstance(business_status, str) else None,
        "rating": float(rating) if isinstance(rating, (int, float)) else None,
        "user_rating_count": int(user_rating_count) if isinstance(user_rating_count, int) else 0,
        "types": [item for item in types if isinstance(item, str)] if isinstance(types, list) else [],
        "primary_type": primary_type if isinstance(primary_type, str) else None,
        "google_maps_uri": google_maps_uri if isinstance(google_maps_uri, str) else None,
        "matched_queries": [query.text_query],
        "matched_query_groups": [query.group],
    }


def merge_place(existing: dict[str, Any], incoming: dict[str, Any]) -> dict[str, Any]:
    existing_queries = set(str(item) for item in existing.get("matched_queries", []))
    incoming_queries = [str(item) for item in incoming.get("matched_queries", [])]
    existing_groups = set(str(item) for item in existing.get("matched_query_groups", []))
    incoming_groups = [str(item) for item in incoming.get("matched_query_groups", [])]
    existing["matched_queries"] = sorted(existing_queries.union(incoming_queries))
    existing["matched_query_groups"] = sorted(existing_groups.union(incoming_groups))

    if incoming.get("user_rating_count", 0) > existing.get("user_rating_count", 0):
        for key in [
            "name",
            "formatted_address",
            "business_status",
            "rating",
            "user_rating_count",
            "types",
            "primary_type",
            "google_maps_uri",
        ]:
            existing[key] = incoming[key]

    return existing


def is_eligible(place: dict[str, Any]) -> bool:
    rating = place.get("rating")
    user_rating_count = place.get("user_rating_count")
    formatted_address = str(place.get("formatted_address", ""))
    business_status = place.get("business_status")
    primary_type = place.get("primary_type")
    types = place.get("types")

    if not isinstance(rating, float) or rating < 4.5:
        return False
    if not isinstance(user_rating_count, int) or user_rating_count <= 0:
        return False
    if business_status is not None and business_status != "OPERATIONAL":
        return False
    if "서울" not in formatted_address and "Seoul" not in formatted_address:
        return False
    if primary_type not in FOOD_TYPES and not (isinstance(types, list) and any(item in FOOD_TYPES for item in types)):
        return False
    return True


def ranked_places(places_by_id: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    eligible_places = [place for place in places_by_id.values() if is_eligible(place)]
    return sorted(
        eligible_places,
        key=lambda place: (
            -int(place["user_rating_count"]),
            -float(place["rating"]),
            str(place["name"]),
        ),
    )


def collect_places(api_key: str, queries: list[QuerySpec], sleep_seconds: float) -> tuple[dict[str, dict[str, Any]], int]:
    places_by_id: dict[str, dict[str, Any]] = {}
    request_count = 0

    for query in queries:
        payload = build_text_search_payload(query.text_query)
        try:
            response = post_json(api_key, TEXT_SEARCH_URL, payload)
        except RuntimeError as error:
            raise CollectionError(str(error), places_by_id, request_count) from error
        request_count += 1

        for raw_place in response.get("places", []):
            if not isinstance(raw_place, dict):
                continue
            normalized = normalize_place(raw_place, query)
            if normalized is None:
                continue
            place_id = str(normalized["place_id"])
            if place_id in places_by_id:
                places_by_id[place_id] = merge_place(places_by_id[place_id], normalized)
            else:
                places_by_id[place_id] = normalized

        if sleep_seconds > 0:
            time.sleep(sleep_seconds)

    return places_by_id, request_count


def write_outputs(
    output_dir: Path,
    places_by_id: dict[str, dict[str, Any]],
    top_places: list[dict[str, Any]],
    request_count: int,
    max_text_search_requests: int,
    budget_usd: float,
    suffix: str = "",
) -> tuple[Path, Path]:
    collected_at = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
    date_slug = collected_at[:10]
    output_dir.mkdir(parents=True, exist_ok=True)
    filename_suffix = f"-{suffix}" if suffix else ""
    full_path = output_dir / f"google-places-seoul-restaurant-candidates-{date_slug}{filename_suffix}.json"
    top_path = output_dir / f"google-places-seoul-top-restaurants-{date_slug}{filename_suffix}.json"
    sorted_candidates = sorted(
        places_by_id.values(),
        key=lambda place: (
            -int(place.get("user_rating_count", 0)),
            -float(place.get("rating") or 0),
            str(place.get("name", "")),
        ),
    )
    metadata = {
        "source": "google_places_text_search_new",
        "collected_at": collected_at,
        "request_strategy": "seoul_25_gu_four_queries_plus_ten_wide_queries_first_page_only",
        "actual_text_search_requests": request_count,
        "max_text_search_requests": max_text_search_requests,
        "place_details_requests": 0,
        "estimated_text_search_enterprise_cost_usd": round(request_count * TEXT_SEARCH_ENTERPRISE_UNIT_COST_USD, 4),
        "estimated_total_cost_usd": round(request_count * TEXT_SEARCH_ENTERPRISE_UNIT_COST_USD, 4),
        "budget_usd": budget_usd,
        "candidate_count": len(sorted_candidates),
        "eligible_count": len(top_places),
        "top_count": min(50, len(top_places)),
        "partial": bool(suffix),
        "filters": {
            "rating_min": 4.5,
            "user_rating_count_min": 1,
            "business_status": "OPERATIONAL",
            "address_contains": ["서울", "Seoul"],
            "included_type": "restaurant",
            "strict_type_filtering": True,
        },
    }
    full_payload = {"metadata": metadata, "places": sorted_candidates}
    top_payload = {"metadata": metadata, "places": top_places[:50]}
    full_path.write_text(json.dumps(full_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    top_path.write_text(json.dumps(top_payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return full_path, top_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect Seoul 4.5+ high-review restaurants from Google Places Text Search.")
    parser.add_argument("--execute", action="store_true", help="Run live Google Places API requests.")
    parser.add_argument("--output-dir", default="datasets", help="Directory for JSON outputs.")
    parser.add_argument("--max-text-search-requests", type=int, default=DEFAULT_MAX_TEXT_SEARCH_REQUESTS)
    parser.add_argument("--max-place-details-requests", type=int, default=DEFAULT_MAX_PLACE_DETAILS_REQUESTS)
    parser.add_argument("--budget-usd", type=float, default=DEFAULT_BUDGET_USD)
    parser.add_argument("--sleep-seconds", type=float, default=0.15)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    env_values = load_env_file(Path(".env"))
    api_key = os.environ.get("GOOGLE_PLACES_API_KEY") or env_values.get("GOOGLE_PLACES_API_KEY")
    query_plan = build_query_plan()[: args.max_text_search_requests]

    ensure_budget(args.max_text_search_requests, args.max_place_details_requests, args.budget_usd)

    estimated_cost = estimate_cost(args.max_text_search_requests, args.max_place_details_requests)
    print(f"query_count={len(query_plan)}")
    print(f"max_text_search_requests={args.max_text_search_requests}")
    print(f"max_place_details_requests={args.max_place_details_requests}")
    print(f"estimated_max_cost_usd={estimated_cost:.2f}")
    print(f"budget_usd={args.budget_usd:.2f}")

    if not args.execute:
        print("dry_run=true")
        print("live_requests=0")
        return 0

    if not api_key:
        print("GOOGLE_PLACES_API_KEY is required for --execute.", file=sys.stderr)
        return 2

    try:
        places_by_id, request_count = collect_places(api_key, query_plan, args.sleep_seconds)
    except CollectionError as error:
        if error.places_by_id:
            top_places = ranked_places(error.places_by_id)
            full_path, top_path = write_outputs(
                Path(args.output_dir),
                error.places_by_id,
                top_places,
                error.request_count,
                args.max_text_search_requests,
                args.budget_usd,
                "partial",
            )
            print(f"partial_text_search_requests={error.request_count}", file=sys.stderr)
            print(f"partial_candidate_count={len(error.places_by_id)}", file=sys.stderr)
            print(f"partial_eligible_count={len(top_places)}", file=sys.stderr)
            print(f"partial_candidates_path={full_path}", file=sys.stderr)
            print(f"partial_top_path={top_path}", file=sys.stderr)
        print(str(error), file=sys.stderr)
        return 1

    top_places = ranked_places(places_by_id)
    full_path, top_path = write_outputs(
        Path(args.output_dir),
        places_by_id,
        top_places,
        request_count,
        args.max_text_search_requests,
        args.budget_usd,
    )

    print(f"actual_text_search_requests={request_count}")
    print(f"candidate_count={len(places_by_id)}")
    print(f"eligible_count={len(top_places)}")
    print(f"top_count={min(50, len(top_places))}")
    print(f"candidates_path={full_path}")
    print(f"top_path={top_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
