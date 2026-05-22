# Top 50 Restaurant Dot Map

## 목적

Google Places 기반 서울 Top 50 식당의 서울 내 위치 분포를 dot map으로 확인하기 위해 좌표 보강 데이터와 정적 PNG 시각화를 생성했다.

## 입력 데이터

- 원본 Top 50: `datasets/google-places-seoul-top-restaurants-2026-05-15.json`
- 선정 기준: 평점 `4.5` 이상 후보 중 `user_rating_count` 내림차순, `rating` 내림차순, `name` 오름차순으로 Top 50

## 구현

- 좌표 보강 및 지도 생성 스크립트: `scripts/plot_google_places_seoul_top_restaurant_dots.py`
- 회귀 검증 스크립트: `scripts/check_google_places_top_restaurant_dot_map.py`
- 좌표 캐시: `datasets/google-places-seoul-top-restaurants-2026-05-15-locations.json`
- PNG 산출물: `visualizations/google-places-seoul-top-restaurants-dot-map-2026-05-15.png`

좌표 캐시는 Google Places Details New의 `id,location` field mask로 Place ID별 위경도만 보강한다. 캐시가 존재하면 재실행 시 API를 다시 호출하지 않고 같은 PNG를 재생성한다.

## 시각화 구성

- 서울 rough outline과 한강 기준선을 배치했다.
- Top 50 식당은 동일 위치 좌표에 dot으로 표시했다.
- Top 10 rank는 파란색, 나머지 Top 50은 주황색으로 구분했다.
- 오른쪽에는 구별 Top 50 개수를 함께 표시했다.

현재 구별 분포 상위권은 다음과 같다.

| 구 | 개수 |
| --- | ---: |
| 중구 | 12 |
| 마포구 | 9 |
| 강남구 | 8 |
| 종로구 | 5 |
| 성동구 | 4 |
| 용산구 | 3 |

## 검증

다음 명령을 통과했다.

```bash
python3 scripts/plot_google_places_seoul_top_restaurant_dots.py
python3 scripts/check_google_places_top_restaurant_dot_map.py
python3 -m py_compile scripts/plot_google_places_seoul_top_restaurant_dots.py scripts/check_google_places_top_restaurant_dot_map.py
```

검증 내용:

- 원본 Top 50과 좌표 캐시의 Place ID 순서 일치
- 좌표 캐시 Place 수 `50`
- 모든 위경도가 서울 rough bounds 안에 있음
- PNG 이미지 존재, 충분한 크기, nonblank 렌더링 확인

이 저장소에는 `package.json`, `tsconfig.json`, eslint 설정이 없어 TypeScript/eslint 실행 대상은 없다.
