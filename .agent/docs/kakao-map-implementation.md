# Kakao Map Dot Distribution

- `client/app/map/page.tsx`에 Kakao Map 구현을 추가했습니다.
- `react-kakao-maps-sdk`를 활용하여 Top 50 식당 데이터를 지도에 렌더링합니다.
- Top 10 식당은 파란색 별 마커를, 11-50위 식당은 기본 마커(주황색)를 사용하여 구분을 명확히 했습니다.
- 마커 클릭 시 식당의 상세 정보(이름, 평점, 리뷰 수, 구 등)가 표시됩니다.
- CI/CD 파이프라인의 `build-client.yml`에 `NEXT_PUBLIC_KAKAO_MAP_API_KEY` 환경 변수를 추가했습니다.
- Full Strict Typing 원칙에 따라 `RestaurantLocation` 등 명시적 타입을 선언하였으며 eslint/typecheck 검증을 통과했습니다.
