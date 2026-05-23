# Google Maps Review UI Collection

## 2026-05-23 5년 컷오프 데이터 정리 및 전체 재수집 시작 준비

- `scripts/prune_google_maps_review_age_cutoff.mjs`를 추가해 Google Maps review JSON의 `relative_time` 기준 5년 초과 리뷰를 final/partial 파일에서 동일하게 제거할 수 있게 했다.
- dry-run 후 `--execute`로 `datasets/google-maps-reviews-2026-05-16/` 전체 100개 review JSON을 처리했다.
- 제거 대상은 final 9개와 partial 9개, 총 18개 파일이었다.
- 제거된 5년 초과 리뷰는 final 기준 1,761개, final/partial 합산 3,522개다.
- 영향을 받은 rank는 2, 21, 22, 38, 42, 43, 44, 45, 46이다.
- final 리뷰 총량은 86,342개에서 84,581개로 정리됐고, 텍스트가 있는 final 리뷰는 76,664개다.
- `node scripts/prune_google_maps_review_age_cutoff.mjs --max-review-age-years 5 --check`에서 5년 초과 잔여 리뷰 0개를 확인했다.
- 전체 재수집은 기존 수집 스크립트를 아래처럼 5년 컷오프로 실행한다. 현재 `/tmp/hidden-bites-playwright` 런타임은 없어, 로컬에 남아 있는 `/Users/dongzoolee/Projects/cspoon/node_modules/playwright-core/index.js`를 `PLAYWRIGHT_CORE_PATH`로 지정해야 한다.

```bash
PLAYWRIGHT_CORE_PATH=/Users/dongzoolee/Projects/cspoon/node_modules/playwright-core/index.js \
node scripts/collect_google_maps_reviews_ui.mjs \
  --headful \
  --start-index 1 \
  --limit-places 50 \
  --scroll-delay-ms 250 \
  --idle-scrolls 220 \
  --max-review-age-years 5 \
  --user-data-dir /tmp/hidden-bites-profile-age5-all-20260523 \
  --prewarm-ranks 1,2
```

## 2026-05-23 5년 컷오프 전체 재수집 완료

- 위 실행 명령을 Terminal 세션에서 끝까지 추적해 rank 1-50 전체 수집을 완료했다.
- 데이터셋 디렉터리: `datasets/google-maps-reviews-2026-05-16/`
- final JSON 50개와 partial JSON 50개가 모두 존재하며, partial-only 상태는 없다.
- final 리뷰 총량은 90,331개, 텍스트가 있는 final 리뷰는 81,836개다.
- partial 리뷰 총량도 final과 동일하게 90,331개이며, 텍스트가 있는 partial 리뷰는 81,836개다.
- 5년 초과 리뷰 정리 직후 84,581개였던 final 리뷰 총량이 전체 재수집 후 5,750개 증가했다.
- 상태별 장소 수는 `target_reached` 8개, `age_cutoff_reached` 4개, `idle_limit_reached` 38개다.
- 이번 전체 재수집에서 `age_cutoff_reached`로 닫힌 장소는 rank 36 더식당 명동 1,553개, rank 42 농민백암순대 1,001개, rank 43 유즈라멘 본점 1,024개, rank 50 원조할아버지손두부 928개다.
- 목표치에 도달한 장소는 rank 13 이태리국시 성수 2,936개, rank 21 탐광 2,649개, rank 34 멘쇼쿠 1,959개, rank 35 지강한식당 잠실점 1,820개, rank 37 혼고집 명동직영점 1,740개, rank 39 태초갈비 명동점 1,658개, rank 41 하이웨이 서울 기사식당 1,481개, rank 47 아베크 청담 1,458개다.
- 1,000개 미만으로 닫힌 장소는 rank 5 강남 돼지상회 443개, rank 15 쌤쌤쌤 546개, rank 25 솥내음 마곡 발산역점 570개, rank 40 오시 망원본점 510개, rank 49 뚝배기집 765개, rank 50 원조할아버지손두부 928개다.
- 전체 재수집 종료 후 `node scripts/prune_google_maps_review_age_cutoff.mjs --max-review-age-years 5 --check`로 5년 초과 잔여 리뷰 0개를 다시 확인했다.
- `node --check`, `PYTHONDONTWRITEBYTECODE=1 python3 -m py_compile`, 전체 JSON 101개 파싱, `git diff --check` 검증을 통과했다.

## 2026-05-23 idle 38개 장소 재시도 시작

- `scripts/collect_google_maps_reviews_ui.mjs`에 `--only-ranks` 옵션을 추가해 비연속 rank 목록만 재수집할 수 있게 했다.
- 재시도 전용으로 `--resume-idle-from-zero` 옵션을 추가해 기존 리뷰 수가 많은 장소도 idle 확인을 0부터 시작할 수 있게 했다.
- 전체 재수집 후 `idle_limit_reached`로 남은 38개 장소만 다시 시도한다.
- 대상 rank는 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 38, 40, 44, 45, 46, 48, 49다.
- 이번 재시도는 기존보다 느린 `--scroll-delay-ms 500`과 더 긴 `--idle-scrolls 500`을 사용해 Google Maps UI의 추가 lazy-load 여지를 더 길게 확인한다.

```bash
PLAYWRIGHT_CORE_PATH=/Users/dongzoolee/Projects/cspoon/node_modules/playwright-core/index.js \
node scripts/collect_google_maps_reviews_ui.mjs \
  --headful \
  --only-ranks 1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,22,23,24,25,26,27,28,29,30,31,32,33,38,40,44,45,46,48,49 \
  --scroll-delay-ms 500 \
  --idle-scrolls 500 \
  --resume-idle-from-zero \
  --max-review-age-years 5 \
  --user-data-dir /tmp/hidden-bites-profile-age5-idle-retry-20260523 \
  --prewarm-ranks 1,2
```

## 2026-05-23 idle 38개 장소 재시도 완료

- 위 재시도 명령을 끝까지 추적해 대상 38개 rank가 모두 종료된 것을 확인했다.
- 재시도 로그 기준 상태는 `target_reached` 4개, `age_cutoff_reached` 1개, `idle_limit_reached` 33개이며 오류 이벤트는 없었다.
- 전체 final JSON 50개와 partial JSON 50개가 모두 존재하며, partial-only 상태는 없다.
- final 리뷰 총량은 90,331개에서 98,552개로 8,221개 증가했고, 텍스트가 있는 final 리뷰는 89,681개다.
- partial 리뷰 총량도 final과 동일하게 98,552개이며, 텍스트가 있는 partial 리뷰는 89,681개다.
- 재시도 후 전체 상태별 장소 수는 `target_reached` 12개, `age_cutoff_reached` 5개, `idle_limit_reached` 33개다.
- 이번 재시도에서 목표치에 도달한 장소는 rank 15 쌤쌤쌤 2,870개, rank 20 성수다락 2,671개, rank 25 솥내음 마곡 발산역점 2,410개, rank 40 오시 망원본점 1,576개다.
- rank 49 뚝배기집은 `6년 전` 컷오프를 만나 765개, `age_cutoff_reached`로 종료됐다.
- 주요 증가량은 rank 5 강남 돼지상회 +2,827개, rank 15 쌤쌤쌤 +2,324개, rank 25 솥내음 마곡 발산역점 +1,840개, rank 40 오시 망원본점 +1,066개다.

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
