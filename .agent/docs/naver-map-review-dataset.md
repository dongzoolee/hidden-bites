# 네이버 지도 리뷰 Dataset 수집 기록

## 산출물

- 파일: `datasets/naver-map-reviews-2026-05-13.json`
- 생성 시각: `2026-05-13T12:21:34.474+09:00`
- 원천: 네이버 지도
- 장소 수: 10
- 리뷰 수: 4,091
- 장소별 리뷰 수: 최대 500
- 정렬 기준: 최신순

## 수집 장소

| 순번 | 장소명 | 분류 | 네이버 카테고리 | 수집 리뷰 수 | 원천 리뷰 수 |
| --- | --- | --- | --- | --- | --- |
| 1 | 탕화쿵푸마라탕 압구정역점 | restaurant | 마라탕 | 236 | 236 |
| 2 | 팔로피자 | restaurant | 이탈리아음식 | 500 | 677 |
| 3 | 보배반점 양재점 | restaurant | 중식당 | 500 | 1,147 |
| 4 | 마더린러 베이글 | cafe | 베이글 | 500 | 1,728 |
| 5 | 어반플랜트 합정 | cafe | 브런치카페 | 500 | 7,628 |
| 6 | 광어연어 | restaurant | 생선회 | 260 | 260 |
| 7 | 또바기 | restaurant | 해물,생선요리 | 95 | 95 |
| 8 | 브로트아트 여의도 본점 | cafe | 베이커리 | 500 | 3,287 |
| 9 | 규카츠정 성수점 | restaurant | 일식당 | 500 | 6,156 |
| 10 | 대진 도원참치 강남역점 | restaurant | 생선회 | 500 | 1,963 |

## 저장 구조

Dataset은 `naver-map-review-schema.md`에서 정리한 권장 구조를 기준으로 저장했다.

각 장소에는 `location`, `collection`, `reviews`를 포함한다. 각 리뷰에는 최신순 순번, 방문일, 방문 시간대, 예약 여부, 대기 시간, 방문 목적, 동행 형태, 원문 리뷰, 네이버 키워드, 추론 근거를 저장했다.

## 2026-05-13 장소별 50개 Overwrite

기존 장소별 5개 수집 파일을 같은 경로에서 장소별 50개 기준으로 덮어썼다.

- `reviews_per_location`을 `50`으로 변경했다.
- `reviews_count`를 `500`으로 변경했다.
- 각 장소의 `collection.limit`을 `50`으로 변경했다.
- 기존 notebook 호환을 위해 각 장소 item의 `position` 필드를 유지했다.
- 각 장소의 `reviews` 배열을 최신순 50개로 확장했다.
- Browser와 Playwright로 네이버 지도 방문자 리뷰 카드를 다시 확인해 작성 리뷰 본문을 보강했다.
- 네이버 지도에 작성 리뷰 원문 없이 키워드만 있는 리뷰는 `text`를 빈 문자열로 두고 `naver_keywords`를 보존했다.

## 검증

다음 조건을 확인했다.

- `locations_count == 10`
- `reviews_count == 500`
- `reviews_per_location == 50`
- 모든 장소의 `reviews.length == 50`
- 모든 리뷰에 `text` 필드가 존재한다.
- 모든 리뷰에 `visited_date`가 존재한다.
- 모든 장소에서 `reviews[].rank`가 1부터 50까지 순서대로 존재한다.
- 작성 리뷰 본문이 있는 항목은 485개이고, 작성 본문 없이 네이버 키워드만 있는 항목은 15개다.

## 2026-05-13 장소별 최대 500개 Overwrite

장소별 최신순 방문자 리뷰를 최대 500개까지 다시 수집해 같은 JSON 파일을 덮어썼다.

- `reviews_per_location`과 `max_reviews_per_location`을 `500`으로 변경했다.
- `reviews_count`를 실제 수집 리뷰 수 기준 `4091`로 변경했다.
- 각 장소의 `collection.limit`을 `500`으로 변경했다.
- 각 장소의 `collection.source_total`에 네이버가 반환한 원천 리뷰 수를 저장했다.
- 각 장소의 `collection.collected_count`에 실제 수집 리뷰 수를 저장했다.
- 기존 notebook 호환을 위해 각 장소 item의 `position` 필드를 유지했다.
- 네이버 GraphQL `getVisitorReviews` 응답을 기준으로 `source_review_id`, `review_group_id`, `reviewer`, `visited_date`, `naver_keywords`, `visit_count`, `origin_type`, `item_name`, `media_count`를 보존했다.

## 2026-05-13 최대 500개 검증

다음 조건을 확인했다.

- `locations_count == 10`
- `reviews_count == 4091`
- `reviews_per_location == 500`
- `max_reviews_per_location == 500`
- 모든 장소의 `reviews.length <= 500`
- 모든 장소의 `collection.collected_count == reviews.length`
- 모든 장소의 `reviews[].rank`가 1부터 수집 리뷰 수까지 순서대로 존재한다.
- 모든 리뷰에 `text` 필드가 존재한다.
- 작성 리뷰 본문이 있는 항목은 3961개이고, 작성 본문 없이 네이버 키워드만 있는 항목은 130개다.
