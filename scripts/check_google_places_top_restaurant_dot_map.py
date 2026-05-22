from __future__ import annotations

import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = ROOT / "datasets" / "google-places-seoul-top-restaurants-2026-05-15.json"
LOCATION_PATH = ROOT / "datasets" / "google-places-seoul-top-restaurants-2026-05-15-locations.json"
IMAGE_PATH = ROOT / "visualizations" / "google-places-seoul-top-restaurants-dot-map-2026-05-15.png"
SEOUL_LON_RANGE = (126.74, 127.22)
SEOUL_LAT_RANGE = (37.40, 37.72)


def read_json(path: Path) -> dict[str, object]:
    return json.loads(path.read_text(encoding="utf-8"))


def get_places(path: Path) -> list[dict[str, object]]:
    places = read_json(path).get("places")
    if not isinstance(places, list):
        raise AssertionError(f"{path} does not contain places")
    return [place for place in places if isinstance(place, dict)]


def assert_place_alignment() -> None:
    source_places = get_places(SOURCE_PATH)
    location_places = get_places(LOCATION_PATH)
    if len(source_places) != 50:
        raise AssertionError(f"source place count is {len(source_places)}")
    if len(location_places) != 50:
        raise AssertionError(f"location place count is {len(location_places)}")
    source_ids = [place.get("place_id") for place in source_places]
    location_ids = [place.get("place_id") for place in location_places]
    if source_ids != location_ids:
        raise AssertionError("location places are not aligned with source Top 50 order")
    for place in location_places:
        rank = place.get("rank")
        location = place.get("location")
        district = place.get("district")
        if not isinstance(rank, int):
            raise AssertionError("rank must be an integer")
        if not isinstance(district, str) or not district:
            raise AssertionError(f"rank {rank} is missing district")
        if not isinstance(location, dict):
            raise AssertionError(f"rank {rank} is missing location")
        latitude = location.get("latitude")
        longitude = location.get("longitude")
        if not isinstance(latitude, (int, float)) or not isinstance(longitude, (int, float)):
            raise AssertionError(f"rank {rank} has invalid coordinates")
        if not SEOUL_LAT_RANGE[0] <= float(latitude) <= SEOUL_LAT_RANGE[1]:
            raise AssertionError(f"rank {rank} latitude is outside Seoul bounds: {latitude}")
        if not SEOUL_LON_RANGE[0] <= float(longitude) <= SEOUL_LON_RANGE[1]:
            raise AssertionError(f"rank {rank} longitude is outside Seoul bounds: {longitude}")


def assert_image_rendered() -> None:
    if not IMAGE_PATH.exists():
        raise AssertionError("dot map image is missing")
    with Image.open(IMAGE_PATH) as image:
        width, height = image.size
        if width < 1600 or height < 1000:
            raise AssertionError(f"image is too small: {width}x{height}")
        rgb_image = image.convert("RGB")
        sampled_pixels = list(rgb_image.resize((160, 100)).getdata())
        unique_pixels = len(set(sampled_pixels))
        non_background_pixels = sum(1 for pixel in sampled_pixels if pixel != (247, 241, 232))
        if unique_pixels < 80:
            raise AssertionError(f"image has too little visual variation: {unique_pixels}")
        if non_background_pixels < 1000:
            raise AssertionError(f"image appears blank: {non_background_pixels}")


def main() -> None:
    assert_place_alignment()
    assert_image_rendered()
    print("top_restaurant_dot_map_check=ok")


if __name__ == "__main__":
    main()
