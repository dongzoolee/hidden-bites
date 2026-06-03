# Kakao Map Dot Distribution

- 2026-06-03 메인 story의 `The top-50 dots are not spread evenly across Seoul.` 섹션도 실제 Kakao 지도 기반으로 전환했다.
- `client/components/KakaoMap.tsx`를 standalone `/map` 전용 Tailwind 구현에서 `RestaurantSummary` 기반 공통 component로 정리했다.
- 공통 `KakaoMap`은 Kakao SDK loader, map type/zoom control, custom overlay rank dots, selected restaurant popup, API key missing/error state를 처리한다.
- `client/components/SeoulRestaurantMap.tsx`는 SVG rough Seoul map을 제거하고 공통 `KakaoMap`을 렌더링하며, 기존 district count analysis panel은 유지한다.
- `/map` 페이지는 기존 `client/data/top-restaurants-locations.json` snake_case payload를 `RestaurantSummary`로 normalize해 같은 공통 `KakaoMap`을 재사용한다.
- `client/app/map/page.tsx`에 Kakao Map 구현을 추가했습니다.
- `react-kakao-maps-sdk`를 활용하여 Top 50 식당 데이터를 지도에 렌더링합니다.
- Top 10 식당은 노란 rank dot, 11-50위 식당은 주황 rank dot, selected 식당은 pink dot으로 구분합니다.
- dot 클릭 시 식당의 상세 정보(이름, 평점, 리뷰 수, 구 등)가 지도 popup으로 표시됩니다.
- CI/CD 파이프라인의 `build-client.yml`에 `NEXT_PUBLIC_KAKAO_MAP_API_KEY` 환경 변수를 추가했습니다.
- Full Strict Typing 원칙에 따라 `RestaurantLocation` 등 명시적 타입을 선언하였으며 eslint/typecheck 검증을 통과했습니다.
- 2026-05-30 GitHub Actions `build_client / Build client` 실패 대응으로 `/map` 페이지의 빌드 입력 데이터를 `client/data/top-restaurants-locations.json`에 포함시켰습니다.
- `/map` 페이지가 루트 `datasets` sparse checkout 여부에 의존하지 않도록 `fs`/`path` 기반 로딩을 제거하고 JSON import 기반으로 전환했습니다.
- `client/test/kakao-map-data.test.mjs` 회귀 테스트를 추가해 지도 데이터가 client 패키지 안에 있고 50개 식당 좌표를 포함하는지 검증합니다.
