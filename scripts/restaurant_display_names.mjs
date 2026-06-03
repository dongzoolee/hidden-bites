const foreignTextPattern = /[A-Za-z一-龥ぁ-ゟ゠-ヿ]/u;
const hangulPattern = /\p{Script=Hangul}/u;

const displayNameAliasesByPlaceId = new Map([
  ["ChIJlQqAYNelfDURg2zfveD4eW4", "무탄 코엑스점"],
  ["ChIJJ2fhXx6ZfDURAS3i9i8Wvho", "깃뜰"],
  ["ChIJZ-YgONuYfDUR2w8zpfOvpvE", "강남 돼지상회 홍대점"],
  ["ChIJgcs2nlujfDURZe-3Vni6FcE", "몽블리 명동점"],
  ["ChIJ_QcUXgClfDURTyXwTmxo8-A", "이태리국시 성수"],
  ["ChIJT0grpESjfDURjERxH-P8Yyw", "지강한식당 압구정본점"],
  ["ChIJ3yUZyjWjfDURTpUVNSxW-fk", "이국도산"],
  ["ChIJa5S93O2jfDURwEVYqIpHXkg", "장인닭갈비 명동점"],
  ["ChIJbS0WnoulfDUROvcR0nVjN18", "성수다락"],
  ["ChIJvaFDDaaYfDURFqfz9lWTpPA", "곱 마포직영점"],
  ["ChIJE89GzuqlfDUR0wdBchnDVA4", "지강한식당 잠실점"],
  ["ChIJG2XObfCifDURwcxOBbGdLkU", "더식당 명동점"],
  ["ChIJKeMm9s2jfDURck7uJeHBIYg", "태초갈비 명동점"],
  ["ChIJNyNawWmffDURFZO3KAMpcZI", "하이웨이 서울 영등포점"],
  ["ChIJ749NGfCifDURVRam9mS9tyk", "빤닭빤닭 명동점"],
  ["ChIJLa2wIcijfDUR0oCbGSc9kxE", "아베크 청담"],
  ["ChIJ32V8iv6hfDUR-UMjO61PeWE", "다몽집"]
]);

export function buildDisplayPlaceName(placeId, placeName) {
  const alias = displayNameAliasesByPlaceId.get(placeId);

  if (alias) {
    return alias;
  }

  const normalized = normalizePlaceName(placeName);
  assertKoreanDisplayPlaceName(normalized, placeId);

  return normalized;
}

export function assertKoreanDisplayPlaceName(displayPlaceName, context) {
  if (typeof displayPlaceName !== "string" || displayPlaceName.trim().length === 0) {
    throw new Error(`Missing Korean display place name: ${context}`);
  }

  if (!hangulPattern.test(displayPlaceName)) {
    throw new Error(`Korean display place name must include Hangul: ${context}`);
  }

  if (foreignTextPattern.test(displayPlaceName)) {
    throw new Error(`Korean display place name contains foreign text: ${context} ${displayPlaceName}`);
  }
}

function normalizePlaceName(placeName) {
  const cleanedCandidates = String(placeName)
    .split(/\s*(?:[|/ㅣ]|(?:\bl\b))\s*/iu)
    .map(cleanPlaceNameSegment)
    .filter((candidate) => hangulPattern.test(candidate));
  const candidates = cleanedCandidates.length > 0 ? cleanedCandidates : [cleanPlaceNameSegment(placeName)];
  const bestCandidate = candidates.sort((left, right) => rankDisplayCandidate(right) - rankDisplayCandidate(left) || left.localeCompare(right, "ko-KR"))[0] ?? "";

  return bestCandidate;
}

function cleanPlaceNameSegment(value) {
  return String(value)
    .replace(/\([^)]*[A-Za-z一-龥ぁ-ゟ゠-ヿ][^)]*\)/gu, " ")
    .replace(/（[^）]*[A-Za-z一-龥ぁ-ゟ゠-ヿ][^）]*）/gu, " ")
    .replace(/[A-Za-z][A-Za-z0-9+&'.-]*/gu, " ")
    .replace(/[一-龥ぁ-ゟ゠-ヿ]+/gu, " ")
    .replace(/[()[\]{}<>（）]/gu, " ")
    .replace(/[\\,:;"“”‘’!?_+=#*~`^]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/^(?:서울|명동|홍대|성수|송파구|공덕|강남)\s*맛집\s*/u, "")
    .replace(/\s*맛집$/u, "")
    .trim();
}

function rankDisplayCandidate(candidate) {
  const genericPenalty = (candidate.match(/맛집|레스토랑|음식점|무한리필/gu) ?? []).length * 8;
  const lengthScore = Math.min(candidate.length, 14);

  return lengthScore - genericPenalty;
}
