# Google Places 서울 고평점 리뷰수 Top 식당 수집

## 목적

서울에서 Google 평점 4.5 이상이고 리뷰 수가 많은 식당 후보를 개인 연구용으로 수집한다. 정확한 서울 전수 수집보다 비용 제한과 구현 단순성을 우선한다.

## 구현

- 스크립트: `scripts/collect_google_places_seoul_top_restaurants.py`
- API: Places API Text Search (New)
- 기본 비용 상한: `$5`
- 기본 Text Search request cap: `110`
- Place Details request cap: `0`
- API key는 `GOOGLE_PLACES_API_KEY` 환경변수 또는 `.env`에서 읽는다.
- API key는 저장소에 저장하지 않는다.

## 수집 전략

25개 서울 구마다 다음 4개 query를 실행한다.

- `서울 {구} 맛집`
- `서울 {구} 식당`
- `서울 {구} 한식`
- `서울 {구} 고기집`

이후 서울 전체 보강 query 10개를 실행한다.

- `서울 맛집`
- `서울 식당`
- `서울 한식`
- `서울 고기집`
- `서울 일식`
- `서울 중식`
- `서울 양식`
- `서울 국밥`
- `서울 라멘`
- `서울 파스타`

각 query는 첫 페이지만 요청하고 pagination은 따라가지 않는다. Text Search request는 `pageSize: 20`, `minRating: 4.5`, `includedType: restaurant`, `strictTypeFiltering: true`, 서울 rough rectangle `locationRestriction`을 사용한다.

## FieldMask

요청 필드는 비용과 저장 범위를 줄이기 위해 아래로 고정했다.

- `places.id`
- `places.displayName`
- `places.formattedAddress`
- `places.businessStatus`
- `places.rating`
- `places.userRatingCount`
- `places.types`
- `places.primaryType`
- `places.googleMapsUri`
- `nextPageToken`

리뷰 원문, 사진, 요약, 영업시간, 전화번호, 웹사이트는 수집하지 않는다.

## 비용 제한

스크립트는 실행 전 최대 비용을 계산한다.

```text
Text Search Enterprise request 110회 x $0.035 = $3.85
Place Details Enterprise request 0회 x $0.020 = $0
최대 예상 비용 = $3.85
```

`--budget-usd`보다 큰 cap 조합이면 live request 전에 중단한다.

## 실행

Dry run:

```bash
python3 scripts/collect_google_places_seoul_top_restaurants.py
```

Live run:

```bash
GOOGLE_PLACES_API_KEY=... python3 scripts/collect_google_places_seoul_top_restaurants.py --execute
```

또는 `.env`:

```bash
cp .env.example .env
```

`.env`에 `GOOGLE_PLACES_API_KEY`를 채운 뒤 실행한다.

## 산출물

Live run은 다음 파일을 생성한다.

- `datasets/google-places-seoul-restaurant-candidates-YYYY-MM-DD.json`
- `datasets/google-places-seoul-top-restaurants-YYYY-MM-DD.json`

중간 실패가 발생했지만 일부 후보를 이미 수집한 경우에는 `-partial` suffix가 붙은 JSON을 저장한다.

정렬 기준은 `userRatingCount` 내림차순, `rating` 내림차순, `name` 오름차순이다.

## 검증

- API key가 없어도 dry run에서 request 수와 최대 예상 비용을 확인했다.
- live run은 API key가 준비된 뒤 실행한다.
- 저장 후 Place ID 중복 제거, `rating >= 4.5`, `userRatingCount > 0`, 서울 주소, 운영 중 status 필터를 적용한다.
- 현재 repository에는 TypeScript/eslint 대상이 없으므로 Python syntax compile과 dry run으로 검증한다.

## 2026-05-15 실행 기록

- `.env` 파일 존재를 확인했다. 키 값은 출력하지 않았다.
- `python3 -m py_compile scripts/collect_google_places_seoul_top_restaurants.py`를 통과했다.
- dry run에서 `query_count=110`, `estimated_max_cost_usd=$3.85`, `budget_usd=$5.00`을 확인했다.
- live run은 Google API 응답 `API key expired. Please renew the API key.`로 중단됐다.
- 데이터 파일은 아직 생성되지 않았다.
- 이후 중간 실패 시 partial JSON을 저장하도록 스크립트를 보강했다.

## 2026-05-15 재실행 기록

- 1 request smoke live run이 정상 통과했다.
- 이전 full run이 일부 성공 request를 만들었을 가능성이 있어 `$5` 상한을 지키기 위해 최종 수집은 `--max-text-search-requests 30`으로 제한했다.
- 최종 live run 결과:
  - `actual_text_search_requests=30`
  - `estimated_total_cost_usd=$1.05`
  - `candidate_count=427`
  - `eligible_count=427`
  - `top_count=50`
- 생성 파일:
  - `datasets/google-places-seoul-restaurant-candidates-2026-05-15.json`
  - `datasets/google-places-seoul-top-restaurants-2026-05-15.json`
- JSON 유효성, Top 50 중복 Place ID 없음, `rating >= 4.5`, `userRatingCount > 0` 조건을 확인했다.
