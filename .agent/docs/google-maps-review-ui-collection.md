# Google Maps Review UI Collection

## 2026-05-16 작업 내용

- `scripts/collect_google_maps_reviews_ui.mjs`를 추가해 Google Maps 장소 리뷰 탭을 Playwright로 열고, 최신순 리뷰 카드를 스크롤 수집하도록 구현했다.
- 수집 결과는 `datasets/google-maps-reviews-2026-05-16/` 아래에 rank별 JSON과 partial JSON으로 저장한다.
- 각 리뷰는 `source_review_id`, 작성자 표시명, 작성자 통계, 별점, 상대 시간, 본문, 사진 개수, 원문 텍스트, place/rank/source metadata를 포함한다.
- 스크롤 중 Google Maps UI가 더 이상 새 리뷰 카드를 노출하지 않으면 `idle_limit_reached`로 종료한다.
- 사용자 요청에 따라 `--max-review-age-years 5` 옵션을 추가했다. 최신순 수집 중 `6년 전`처럼 5년 초과 리뷰가 반복 감지되면 해당 장소를 `age_cutoff_reached`로 종료하고, 5년 초과 리뷰는 저장하지 않는다.
- 기존 partial/final 파일을 읽어 같은 `source_review_id` 기준으로 이어받고 중복 제거한다.

## 현재 데이터셋 상태

- 데이터셋 디렉터리: `datasets/google-maps-reviews-2026-05-16/`
- 현재 수집 총량: 약 55,010개 리뷰 카드
- 5년 컷오프 적용 수집이 시작된 rank: 5, 6, 15, 16, 25, 26, 27, 28, 40, 50
- `age_cutoff_reached` 확인 장소: 별양집, 월화고기 보라매점
- 일부 장소는 Google Maps UI가 목표 리뷰 수보다 적은 카드만 노출해 `idle_limit_reached` 또는 partial 상태로 남아 있다.

## 실행 예시

```bash
node scripts/collect_google_maps_reviews_ui.mjs --headful --start-index 49 --limit-places 1 --scroll-delay-ms 250 --idle-scrolls 220 --user-data-dir /tmp/hidden-bites-profile-r49 --prewarm-ranks 1,2
```

```bash
node scripts/collect_google_maps_reviews_ui.mjs --headful --start-index 25 --limit-places 11 --scroll-delay-ms 250 --idle-scrolls 220 --max-review-age-years 5 --user-data-dir /tmp/hidden-bites-profile-r25-35-age5 --prewarm-ranks 1,2
```

## 검증

- `node --check scripts/collect_google_maps_reviews_ui.mjs`
- `datasets/google-maps-reviews-2026-05-16/*.json` JSON 파싱 검증

