# Review Adjectives Website Integration

## 산출물

- 최종 source artifact: `datasets/derived/review-adjectives.json`
- 원본 입력: `datasets/google-maps-reviews-2026-05-16`의 rank JSON 50개
- 웹 report payload: `datasets/derived/hb-score-web-report.json`
- 빌드 스크립트: `scripts/build_hb_score_web_report.mjs`
- adjective full extraction: `scripts/extract_review_adjectives_full.py`
- Python deps: `scripts/review_adjectives_requirements.txt`

## 구현 내용

- `scripts/extract_review_adjectives_full.py`가 raw Google Maps review JSON에서 한국어 리뷰를 감지하고 Kiwi로 adjective를 재추출한다.
- 추출 대상은 `001-...json`부터 `050-...json`까지 rank JSON 50개이며 `.partial.json`과 `run-metadata.json`은 제외한다.
- 노트북과 동일하게 `place_id + text` 기준 중복 리뷰를 제거한 뒤 language detection을 수행한다.
- `review-adjectives.json`은 기존 `metadata`, `global_top100`, `per_restaurant`, `category_draft`에 더해 `global_all_top100`, `adjective_counts`, `filtered_adjective_counts`를 가진다.
- `scripts/build_hb_score_web_report.mjs`는 `place_rank` 기준으로 HB score restaurant과 adjective profile을 join한다.
- 각 restaurant report는 기존 `emotionBuckets` 대신 `adjectiveBuckets`를 포함한다.
- `adjectiveBuckets`는 Figma node `313:9492`의 7개 Emotion Category를 고정으로 제공한다.
  - `relief`: `😌 안도·편안`
  - `joy`: `😊 유쾌·즐거움`
  - `intense`: `🔥 강렬`
  - `curiosity`: `🧐 호기심·기대`
  - `subtle`: `😐 미미`
  - `fatigue`: `😤 불만·피로`
  - `regret`: `💧 아쉬움`
- 7개 category adjective 사전은 `scripts/review_emotion_categories.mjs`에 고정했고, 식당별 full `adjective_counts`를 이 사전으로 매칭해 graph 값을 만든다.
- 각 bucket은 `count`, `share`, `averageShare`, `topAdjectives`를 가진다.
- 각 bucket은 Figma open state에서 보여줄 10개 emotion adjective 사전인 `adjectives`도 가진다.
- `share`는 해당 식당의 전체 extracted adjective count 대비 category count 비율이다.
- `averageShare`는 동일한 기준으로 계산한 all-50 평균 share다.
- `RestaurantReportPanel`의 graph diamond marker는 이제 해당 bucket의 `averageShare`를 사용한다.
- 하단 `The Unique & Fun Keywords`는 기존 raw `report.keywords` chip과 original review snippet filtering을 유지한다.

## 검증 기준

- `scripts/validate_hb_score_web_report.mjs`는 다음 계약을 검증한다.
  - score restaurant 50개와 adjective profile 50개 rank가 일치한다.
  - `review-adjectives.json`에 full `adjective_counts`가 있다.
  - Figma 기반 emotion category는 7개다.
  - 모든 restaurant profile에 최소 1개 mapped adjective가 있다.
  - 무탄 코엑스점은 full count 기준 7개 emotion category가 모두 non-zero다.
  - 모든 report에 `adjectiveBuckets.length === 7`이 있다.
  - `emotionBuckets`는 report payload에 남지 않는다.
- server test는 selected report API가 7개 adjective bucket을 반환하는지 확인한다.
- client test는 7개 emotion graph column, all-50 average marker, top adjective label, graph y-scroll 제거, 0% baseline alignment, 기존 keyword chip/snippet footer 계약을 확인한다.

## 실행한 검증

- `/tmp/hidden-bites-adj-venv/bin/python -m pip install -r scripts/review_adjectives_requirements.txt`
- `/tmp/hidden-bites-adj-venv/bin/python scripts/extract_review_adjectives_full.py`
- `node scripts/build_hb_score_web_report.mjs && node scripts/validate_hb_score_web_report.mjs`
- `cd server && yarn test && yarn type-check && yarn lint`
- `cd client && yarn test && yarn typecheck && yarn lint && yarn build`
- Browser viewport 검증:
  - desktop `1440x1100`: 7개 adjective chip, 7개 graph column, 12개 keyword chip, snippet 최대 4개, body overflow 없음
  - mobile `390x844`: 7개 adjective chip, 7개 graph column, 12개 keyword chip, snippet 최대 4개, body overflow 없음
  - 남은 콘솔 에러는 `favicon.ico` 404 1건뿐이다.

## 참고

- `top30_adjs` 필드명은 backward-compatible summary로 남기고, 현재는 stopword-filtered top30 adjective를 저장한다.
- 웹 graph의 source of truth는 `adjective_counts`이며, 구버전 artifact만 있을 때 `top30_adjs`로 fallback한다.
- GraphQL, Prisma, client codegen 변경은 없다.

## 2026-06-14 emotion graph UI correction

- `RestaurantReportPanel`의 graph eyebrow를 `Adjective Graph`에서 `Emotion Graph`로 변경했다.
- `.emotion-graph__plot`에 `overflow-y: hidden`을 추가해 graph area에 세로 scrollbar가 생기지 않도록 했다.
- bar grid item 정렬을 top-start로 바꾸고 desktop `325px`, mobile `293.333px` bar wrap height를 사용해 각 bar의 bottom edge가 0% grid line과 일치하도록 조정했다.
- `client/test/emotion-graph-layout.test.mjs`를 추가해 label, y-scroll 제거, desktop/mobile 0% baseline alignment 계약을 고정했다.
- Browser DOM verification에서 desktop `2048x1100`, mobile `390x844` 모두 `Emotion Graph`, `overflow-y: hidden`, `hasVerticalScrollbar=false`, bar bottom과 0% line delta `0px`를 확인했다.

## 2026-06-14 emotion graph zero-height and diamond spacing correction

- `RestaurantReportPanel`의 bar height 계산에서 36% minimum clamp를 제거해 `sharePercent === 0`인 category는 실제 `height: 0%`로 렌더링된다.
- bar value text를 `.emotion-graph__bar-value` absolute label로 분리해 label padding이나 min-height가 bar box height를 다시 키우지 않도록 했다.
- `.emotion-graph__marker` 위치는 해당 category의 restaurant share bar top에 `graphMarkerGapPercent`를 더해, diamond가 각 bar 위에 일정한 여백을 두고 떠 있도록 했다.
- Regression guard: `client/test/emotion-graph-layout.test.mjs`가 minimum clamp, `min-height: 36px`, `padding-top: 14px` 재도입을 막고 marker가 `sharePercent` 기반 bar position에 붙는 계약을 검증한다.

## 2026-06-17 Emotion Graph Korean adjective wrap guard

- `.emotion-graph__column small`에서 `overflow-wrap: anywhere`를 제거하고 `overflow-wrap: normal`, `word-break: keep-all`을 적용해 `엄청나다` 같은 한국어 형용사가 글자 단위로 쪼개지지 않도록 했다.
- Regression guard: `client/test/emotion-graph-layout.test.mjs`가 Emotion Graph adjective label의 Korean word-break contract와 `overflow-wrap: anywhere` 재도입 금지를 검증한다.

## 2026-06-17 Emotion Graph x-axis label spacing

- `.emotion-graph__column`의 label row를 desktop `40px`, mobile `34px`로 늘리고 emoji label에 desktop `12px`, mobile `10px` top padding을 적용해 0% x-axis와 emotion label 사이 여백을 추가했다.
- Regression guard: `client/test/emotion-graph-layout.test.mjs`가 desktop/mobile label row height와 emoji top padding 계약을 검증한다.

## 2026-06-14 Figma 7-category emotion taxonomy

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`의 `Toggle_Closed` node `313:9401`, `Toggle_Open` node `313:9492`를 MCP `get_design_context`와 `get_screenshot`으로 확인했다.
- 사이트의 Emotion Category는 `Relief`, `Joy`, `Intense`, `Curiosity`, `Subtle`, `Fatigue`, `Regret` 7개로 고정한다.
- `datasets/derived/review-adjectives.json`의 legacy `category_draft` 4개 분류는 source artifact 보존용으로 남겨두고, 웹 graph 집계에는 사용하지 않는다.
- `scripts/build_hb_score_web_report.mjs`는 `scripts/review_emotion_categories.mjs`의 7개 adjective 사전을 기준으로 식당별 `top30_adjs` count를 bucket count로 집계한다.
- `metadata.adjectiveBucketCount`는 `7`, `metadata.adjectiveTaxonomySource`는 `figma:g1aNjTsNQVz5KPEVqMC4qY:313:9492`로 기록한다.

## 2026-06-14 Figma emotion category toggle

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`의 closed node `313:9401`, open node `313:9492`를 `get_design_context`와 `get_screenshot`으로 재확인했다.
- `RestaurantReportPanel`의 category row 위에 `Emotion Category` label을 추가했다.
- category card는 Figma closed/open 상태처럼 `button` 기반 accordion으로 변경했다.
  - 기본 상태는 closed다.
  - category card를 클릭하면 해당 card만 open되고 다시 클릭하면 close된다.
  - open card는 하단에 해당 category의 10개 emotion adjective 모음을 보여준다.
- card interaction은 `aria-expanded`, `aria-controls`, chevron rotation으로 접근성 상태를 노출한다.
- `adjectiveBuckets[*].adjectives` payload를 추가해 client가 category 단어 사전을 중복 정의하지 않도록 했다.

## 2026-06-14 full adjective count extraction

- `/Users/dongzoolee/Downloads/review_adjectives_exploration.ipynb`의 output과 `/Users/dongzoolee/Downloads/adj_counts (2).json`을 비교한 결과, 노트북 graph는 전체 adjective token 기준이고 JSON은 식당별 top10 summary만 저장한 artifact였다.
- `scripts/extract_review_adjectives_full.py`를 추가해 raw review JSON 50개에서 full adjective count를 재생성했다.
- 생성된 `datasets/derived/review-adjectives.json` 크기는 약 `1.46MB`다.
- 새 metadata는 `total_reviews=84405`, `total_ko_reviews=83990`, `total_adj_tokens=160754`, `unique_adj_count=838`이다. 노트북의 `83989`, `160807`, `837`과는 Kiwi/langdetect runtime 차이로 소폭 다르지만, dedupe 기준과 top word order는 동일 계열이다.
- `per_restaurant[*].adjective_counts`는 stopword 제거 전 full extracted adjective counts이고, `per_restaurant[*].filtered_adjective_counts`는 report stopword 제거 후 full counts다.
- `scripts/build_hb_score_web_report.mjs`는 full `adjective_counts`를 우선 사용하고, 구버전 artifact 호환을 위해 `top30_adjs` fallback을 유지한다.
- 무탄 코엑스점 graph는 full count 기준으로 `Relief 4.0%`, `Joy 0.7%`, `Intense 2.6%`, `Curiosity 1.1%`, `Subtle 2.0%`, `Fatigue 0.5%`, `Regret 1.0%`가 되어 7개 category 모두 non-zero다.
