import { readFile, writeFile } from "node:fs/promises";
import { buildDisplayPlaceName } from "./restaurant_display_names.mjs";

const clientDataPath = "client/data/top-restaurants-locations.json";
const data = JSON.parse(await readFile(clientDataPath, "utf8"));

const places = data.places.map((place) => ({
  rank: place.rank,
  place_id: place.place_id,
  name: place.name,
  display_name: buildDisplayPlaceName(place.place_id, place.name),
  formatted_address: place.formatted_address,
  district: place.district,
  rating: place.rating,
  user_rating_count: place.user_rating_count,
  primary_type: place.primary_type,
  google_maps_uri: place.google_maps_uri,
  location: place.location
}));

await writeFile(clientDataPath, `${JSON.stringify({ ...data, places }, null, 2)}\n`);
