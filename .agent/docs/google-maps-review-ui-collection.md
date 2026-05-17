# Google Maps Review UI Collection

## 2026-05-18 작업 내용

- `/tmp/hidden-bites-playwright` Playwright runtime을 사용해 Google Maps UI review crawl을 이어서 실행했다.
- 기존 partial만 남아 있던 rank 4, 6, 14, 16, 24, 28, 48, 49를 `--max-review-age-years 5` 옵션으로 재실행해 final JSON까지 닫았다.
- 진행 중이던 rank 7-10, 17-20, 29-35 batch도 모두 종료까지 확인했다.
- `place_done` 이후 browser close 단계에서 일부 node 프로세스가 남아 있어, final JSON 작성 확인 후 완료된 프로세스만 종료했다.
- 최종적으로 rank 1-50 모두 final JSON이 존재하고, partial-only 상태는 남아 있지 않다.

## 2026-05-18 최종 데이터셋 상태

- 데이터셋 디렉터리: `datasets/google-maps-reviews-2026-05-16/`
- 현재 수집 총량: 86,342개 리뷰 카드
- 상태별 장소 수: `target_reached` 10개, `age_cutoff_reached` 9개, `idle_limit_reached` 31개
- `running` 또는 partial-only 장소 수: 0개
- 이번 턴에서 5년 컷오프/이어받기로 완료한 주요 rank:
  - 4 홍대 맛집 깃뜰: 3,666개, `idle_limit_reached`
  - 6 Mongvely Myeongdong Korean BBQ: 2,067개, `idle_limit_reached`
  - 7 왕비집 명동본점: 2,800개, `idle_limit_reached`
  - 8 무교동북어국집: 1,975개, `age_cutoff_reached`, 컷오프 `6년 전`
  - 9 미도갈비: 2,650개, `idle_limit_reached`
  - 10 육지 홍대: 3,120개, `idle_limit_reached`
  - 14 서울맛집 지강한식당 압구정본점: 2,497개, `idle_limit_reached`
  - 16 이국도산 EEGUK: 2,137개, `idle_limit_reached`
  - 17 농민백암순대 본점: 1,597개, `age_cutoff_reached`, 컷오프 `6년 전`
  - 18 새마을식당 홍대서교점: 2,664개, `age_cutoff_reached`, 컷오프 `6년 전`
  - 19 장인닭갈비 명동점: 2,520개, `idle_limit_reached`
  - 20 성수다락: 2,632개, `age_cutoff_reached`, 컷오프 `6년 전`
  - 24 한식왕비집 을지로점: 1,959개, `idle_limit_reached`
  - 28 마포곱창타운: 1,499개, `idle_limit_reached`
  - 29 곱 마포직영점: 1,830개, `age_cutoff_reached`, 컷오프 `6년 전`
  - 30 신림춘천집 구로디지털직영점: 1,870개, `idle_limit_reached`
  - 31 오레노라멘 본점: 1,490개, `age_cutoff_reached`, 컷오프 `수정일: 6년 전`
  - 32 왕비집 종로점: 1,576개, `age_cutoff_reached`, 컷오프 `6년 전`
  - 33 돼지래스토랑 둘째: 1,830개, `idle_limit_reached`
  - 34 멘쇼쿠: 1,950개, `target_reached`
  - 35 지강한식당 잠실점: 1,810개, `target_reached`
  - 48 다몽집: 1,316개, `idle_limit_reached`
  - 49 뚝배기집: 764개, `idle_limit_reached`
- rank 49는 5년 컷오프 옵션으로 재실행하면서 저장 리뷰 수가 기존 all-age partial보다 줄었다.

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
