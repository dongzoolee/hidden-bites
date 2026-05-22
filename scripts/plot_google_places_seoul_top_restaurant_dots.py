from __future__ import annotations

import argparse
import json
import os
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

import matplotlib.pyplot as plt
from matplotlib.gridspec import GridSpec
from matplotlib.patches import Polygon


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TOP_PATH = ROOT / "datasets" / "google-places-seoul-top-restaurants-2026-05-15.json"
DEFAULT_LOCATION_PATH = ROOT / "datasets" / "google-places-seoul-top-restaurants-2026-05-15-locations.json"
DEFAULT_OUTPUT_PATH = ROOT / "visualizations" / "google-places-seoul-top-restaurants-dot-map-2026-05-15.png"
SEOUL_BOUNDS = (126.74, 127.22, 37.40, 37.72)
SEOUL_DISTRICTS = [
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
SEOUL_OUTLINE = [
    (126.764, 37.482),
    (126.776, 37.560),
    (126.812, 37.620),
    (126.882, 37.678),
    (126.964, 37.704),
    (127.058, 37.698),
    (127.146, 37.654),
    (127.184, 37.586),
    (127.176, 37.508),
    (127.126, 37.444),
    (127.026, 37.428),
    (126.936, 37.438),
    (126.842, 37.452),
]
HAN_RIVER = [
    (126.792, 37.558),
    (126.846, 37.548),
    (126.902, 37.535),
    (126.964, 37.524),
    (127.024, 37.518),
    (127.082, 37.522),
    (127.146, 37.536),
    (127.190, 37.556),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_TOP_PATH)
    parser.add_argument("--locations-output", type=Path, default=DEFAULT_LOCATION_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--refresh-locations", action="store_true")
    parser.add_argument("--sleep-seconds", type=float, default=0.05)
    return parser.parse_args()


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: dict[str, object]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_google_places_key() -> str:
    value = os.environ.get("GOOGLE_PLACES_API_KEY")
    if value:
        return value
    env_path = ROOT / ".env"
    if env_path.exists():
        for line in env_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("GOOGLE_PLACES_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError("GOOGLE_PLACES_API_KEY is required to fetch missing coordinates")


def extract_places(payload: dict[str, object]) -> list[dict[str, object]]:
    places = payload.get("places")
    if not isinstance(places, list):
        raise ValueError("Input JSON must contain a places list")
    return [place for place in places if isinstance(place, dict)]


def district_from_address(address: object) -> str:
    text = address if isinstance(address, str) else ""
    for district in SEOUL_DISTRICTS:
        if district in text:
            return district
    return "미확인"


def fetch_place_location(place_id: str, api_key: str) -> dict[str, float]:
    url = f"https://places.googleapis.com/v1/places/{quote(place_id, safe='')}"
    request = Request(url, headers={"X-Goog-Api-Key": api_key, "X-Goog-FieldMask": "id,location"})
    try:
        with urlopen(request, timeout=30) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Google Places location request failed for {place_id}: {exc.code} {body[:300]}") from exc
    except URLError as exc:
        raise RuntimeError(f"Google Places location request failed for {place_id}: {exc.reason}") from exc
    location = payload.get("location")
    if not isinstance(location, dict):
        raise RuntimeError(f"Google Places location response is missing location for {place_id}")
    latitude = location.get("latitude")
    longitude = location.get("longitude")
    if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
        raise RuntimeError(f"Google Places location response has invalid coordinates for {place_id}")
    return {"latitude": float(latitude), "longitude": float(longitude)}


def load_location_cache(path: Path) -> dict[str, dict[str, float]]:
    if not path.exists():
        return {}
    payload = read_json(path)
    places = extract_places(payload)
    cache: dict[str, dict[str, float]] = {}
    for place in places:
        place_id = place.get("place_id")
        location = place.get("location")
        if isinstance(place_id, str) and isinstance(location, dict):
            latitude = location.get("latitude")
            longitude = location.get("longitude")
            if isinstance(latitude, (int, float)) and isinstance(longitude, (int, float)):
                cache[place_id] = {"latitude": float(latitude), "longitude": float(longitude)}
    return cache


def build_location_dataset(
    source_payload: dict[str, object],
    source_path: Path,
    location_path: Path,
    refresh_locations: bool,
    sleep_seconds: float,
) -> dict[str, object]:
    source_places = extract_places(source_payload)
    cache = {} if refresh_locations else load_location_cache(location_path)
    missing_place_ids = [place["place_id"] for place in source_places if isinstance(place.get("place_id"), str) and place["place_id"] not in cache]
    if missing_place_ids:
        api_key = load_google_places_key()
        for index, place_id in enumerate(missing_place_ids, 1):
            cache[place_id] = fetch_place_location(place_id, api_key)
            print(f"fetched_location={index}/{len(missing_place_ids)} place_id={place_id}")
            if sleep_seconds > 0:
                time.sleep(sleep_seconds)
    enriched_places: list[dict[str, object]] = []
    for rank, place in enumerate(source_places, 1):
        place_id = place.get("place_id")
        if not isinstance(place_id, str) or place_id not in cache:
            raise RuntimeError(f"Missing location for rank {rank}")
        formatted_address = place.get("formatted_address")
        enriched_places.append(
            {
                "rank": rank,
                "place_id": place_id,
                "name": place.get("name"),
                "formatted_address": formatted_address,
                "district": district_from_address(formatted_address),
                "rating": place.get("rating"),
                "user_rating_count": place.get("user_rating_count"),
                "primary_type": place.get("primary_type"),
                "google_maps_uri": place.get("google_maps_uri"),
                "location": cache[place_id],
            }
        )
    payload = {
        "metadata": {
            "source": "google_places_details_new_location_enrichment",
            "source_dataset": str(source_path.relative_to(ROOT)),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "place_count": len(enriched_places),
            "location_field_mask": "id,location",
        },
        "places": enriched_places,
    }
    write_json(location_path, payload)
    return payload


def configure_fonts() -> None:
    plt.rcParams["font.family"] = ["AppleGothic", "DejaVu Sans"]
    plt.rcParams["axes.unicode_minus"] = False


def render_dot_map(location_payload: dict[str, object], output_path: Path) -> None:
    configure_fonts()
    places = extract_places(location_payload)
    if len(places) != 50:
        raise ValueError(f"Expected 50 places, found {len(places)}")
    locations = [place["location"] for place in places]
    longitudes = [float(location["longitude"]) for location in locations if isinstance(location, dict)]
    latitudes = [float(location["latitude"]) for location in locations if isinstance(location, dict)]
    ranks = [int(place["rank"]) for place in places]
    district_counts = Counter(str(place.get("district", "미확인")) for place in places)
    top_districts = district_counts.most_common(9)
    fig = plt.figure(figsize=(14, 9), facecolor="#f7f1e8")
    grid = GridSpec(1, 2, width_ratios=[3.7, 1.25], wspace=0.08)
    ax = fig.add_subplot(grid[0, 0])
    bar_ax = fig.add_subplot(grid[0, 1])
    fig.subplots_adjust(top=0.86, bottom=0.11)
    ax.set_facecolor("#fbf6eb")
    outline = Polygon(SEOUL_OUTLINE, closed=True, fill=True, facecolor="#fffaf0", edgecolor="#232323", linewidth=1.6, alpha=0.94)
    ax.add_patch(outline)
    han_lons = [point[0] for point in HAN_RIVER]
    han_lats = [point[1] for point in HAN_RIVER]
    ax.plot(han_lons, han_lats, color="#9fc5e8", linewidth=13, alpha=0.38, solid_capstyle="round", zorder=1)
    ax.plot(han_lons, han_lats, color="#5f96c7", linewidth=2.1, alpha=0.65, solid_capstyle="round", zorder=2)
    sizes = [92 if rank <= 10 else 64 for rank in ranks]
    colors = ["#1f4e79" if rank <= 10 else "#d95135" for rank in ranks]
    ax.scatter(longitudes, latitudes, s=sizes, c=colors, edgecolors="#fffaf0", linewidths=1.4, alpha=0.93, zorder=4)
    ax.text(126.93, 37.537, "Han River", color="#3f719f", fontsize=10, weight="bold", rotation=-8, alpha=0.8)
    ax.text(126.90, 37.675, "Northwest / Hongdae", color="#3a332b", fontsize=9, alpha=0.72)
    ax.text(126.970, 37.582, "Jongno / Myeongdong", color="#3a332b", fontsize=9, alpha=0.72)
    ax.text(127.020, 37.500, "Gangnam / COEX", color="#3a332b", fontsize=9, alpha=0.72)
    ax.text(127.055, 37.548, "Seongsu", color="#3a332b", fontsize=9, alpha=0.72)
    ax.set_xlim(SEOUL_BOUNDS[0], SEOUL_BOUNDS[1])
    ax.set_ylim(SEOUL_BOUNDS[2], SEOUL_BOUNDS[3])
    ax.set_xlabel("Longitude")
    ax.set_ylabel("Latitude")
    ax.grid(color="#d8cfc1", linestyle="-", linewidth=0.7, alpha=0.55)
    fig.suptitle("Google Top 50 Restaurants in Seoul", x=0.08, y=0.97, ha="left", fontsize=25, weight="bold", color="#232323")
    fig.text(0.08, 0.925, "Dots are Google Places Top 50 restaurants ranked by review count after rating >= 4.5 filtering.", fontsize=11.5, color="#5a5148")
    ax.text(SEOUL_BOUNDS[1], SEOUL_BOUNDS[2] - 0.027, "Top 10 ranks are highlighted in blue. Other Top 50 dots are orange.", ha="right", fontsize=9.5, color="#5a5148")
    bar_ax.set_facecolor("#f7f1e8")
    labels = [district for district, _ in reversed(top_districts)]
    values = [count for _, count in reversed(top_districts)]
    bar_ax.barh(labels, values, color="#d95135", edgecolor="#232323", linewidth=0.7, alpha=0.92)
    bar_ax.set_title("District count", loc="left", fontsize=15, weight="bold", color="#232323")
    bar_ax.set_xlabel("Restaurants")
    bar_ax.grid(axis="x", color="#d8cfc1", linewidth=0.7, alpha=0.55)
    bar_ax.spines[["top", "right", "left"]].set_visible(False)
    for index, value in enumerate(values):
        bar_ax.text(value + 0.15, index, str(value), va="center", fontsize=10, color="#232323", weight="bold")
    bar_ax.set_xlim(0, max(values) + 2)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=180, bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close(fig)


def main() -> None:
    args = parse_args()
    source_payload = read_json(args.input)
    location_payload = build_location_dataset(source_payload, args.input, args.locations_output, args.refresh_locations, args.sleep_seconds)
    render_dot_map(location_payload, args.output)
    print(f"locations_path={args.locations_output}")
    print(f"output_path={args.output}")


if __name__ == "__main__":
    main()
