# Notion Documentation Client Gap Analysis

## 목적

Notion `Documentation` 페이지의 `Tasks` 8개와 하위 문서를 기준으로, 현재 Hidden Bites client에 반영되지 않았거나 부분 반영된 내용을 점검했다.

## 확인한 Notion task

- `Introduction & Background`
- `HB Score`
- `HB Score` 하위 `About NLI`
- `QnA`
- `The Review Adjectives`
- `Limitations`
- `The Unique & Fun Keywords`
- `The Unique & Fun Keywords` 하위 `Emilia (1)`
- `The Unique & Fun Keywords` 하위 `Madina`
- `Where are they located?`
- `Trial and Error`

## 현재 client 반영 상태 요약

| Notion task | 현재 client 상태 | 남은 gap |
| --- | --- | --- |
| Introduction & Background | Hero, question preview, data-source Q&A로 부분 반영 | Google Maps가 더 authentic/representative하고 foreigner review까지 포함한다는 설명은 약하게만 반영됨 |
| HB Score | 10 factor, 500 score point, score plot은 반영 | NLI 계산식, factor relevance 의미, Google 세부 별점 우선 규칙, count bonus 설명은 사용자 화면에 없음 |
| About NLI | notebook/derived score에는 계산 근거가 있음 | premise/hypothesis pair, `98,562 x 30` NLI pair, entailment probability 설명이 client에 없음 |
| QnA | Q&A accordion은 존재 | Notion의 `past three years` 문구와 client의 `five-year review window`가 불일치함. server summary Q&A가 2개라 client가 fallback Q&A를 사용함 |
| The Review Adjectives | selected report의 adjective/emotion section으로 반영 | Notion 본문이 비어 있어 추가 미반영 요구는 없음 |
| Limitations | coverage, sampling bias, NLP accuracy는 반영 | complimentary/free-review 가능성은 limitation card에 직접 반영되지 않음 |
| The Unique & Fun Keywords | keyword chip과 snippet filter는 반영 | curated funny label taxonomy와 수동 restaurant-specific funny comments가 반영되지 않음 |
| Where are they located? | Kakao map 기반 위치 section으로 반영 | Notion 본문이 비어 있어 추가 미반영 요구는 없음 |
| Trial and Error | 일부 내용이 Q&A/limitations로 흩어져 반영 | trial-and-error narrative와 Google API/scraping limitation 설명이 독립 section으로는 없음 |

## 미반영 또는 불일치 상세

### 1. HB Score 설명의 계산식 레벨이 화면에 없음

Notion `HB Score`에는 다음 계산 흐름이 설명되어 있다.

- `factor_relevance = factor별 hypothesis 3개의 entailment probability 평균`
- `review_hb_score = source_rating_for_factor * factor_relevance`
- `raw_hb_score = sum(review_hb_score) / collected_review_count`
- `count_bonus = 0.25 * log1p(popularity_count) / log1p(max_popularity_count)`
- `hb_score = clip(raw_hb_score + count_bonus, 0.00, 5.00)`

현재 derived payload에는 `rawHbScore`, `countBonus`, `meanFactorRelevance`, `meanFactorDistance`가 들어가지만, client의 score plot은 `factorScore`, `weight`, `weightedScore` 중심으로만 보여준다. 따라서 사용자는 HB Score가 NLI relevance와 Google rating을 어떻게 결합했는지 화면에서 알 수 없다.

관련 근거:

- `scripts/build_hb_score_web_report.mjs`는 factor score payload에 `rawHbScore`, `countBonus`, `meanFactorRelevance`, `meanFactorDistance`를 포함한다.
- `client/components/ScorePlot.tsx`는 selected factor score와 UI weight 기반 weighted score만 노출한다.
- `client/components/HiddenBitesExperience.tsx`의 HB Scores 설명은 slider interaction 중심이다.

### 2. About NLI 하위 문서가 client 설명으로 연결되지 않음

Notion `About NLI`는 리뷰를 premise로 만들고 factor hypothesis 3개를 붙여 `10 factors x 3 hypotheses = 30` NLI pair를 만든다고 설명한다. 또한 `cross-encoder/nli-deberta-v3-large`, entailment probability, `98,562`개 리뷰 기준 `2,956,860`개 pair와 `985,620`개 review-factor row를 명시한다.

현재 client에서 `NLI`가 보이는 지점은 selected report의 짧은 문장뿐이다. 이 문장은 methodology explainer로 보기에는 부족하다.

관련 근거:

- `client/components/RestaurantReportPanel.tsx`는 `pattern NLI emotion analysis` 문구만 노출한다.
- `datasets/derived/hb-score-restaurants.json`에는 factor hypothesis와 score key가 있지만 화면 설명으로 풀리지 않는다.

### 3. QnA의 데이터 기간이 Notion과 client에서 다름

Notion `QnA`는 top 50 선정 후 `past three years` 리뷰를 분석한다고 적고 있다. 현재 client와 `.agent/docs`는 `five-year review window`를 기준으로 구현되어 있다.

현재 runtime payload의 `summary.qna`는 2개뿐이고, `client/components/HiddenBitesExperience.tsx`는 Q&A가 3개 미만이면 server summary를 버리고 hardcoded fallback 3개를 사용한다. 결과적으로 Notion에서 작성한 QnA 문장 자체가 그대로 client에 반영되는 구조가 아니다.

관련 근거:

- `scripts/build_hb_score_web_report.mjs`의 `summary.qna`는 2개다.
- `client/components/HiddenBitesExperience.tsx`는 `items.length >= 3`일 때만 source Q&A를 사용한다.

### 4. Unique & Fun Keywords의 curated label taxonomy가 없음

Notion 하위 `Emilia (1)` 문서는 review expression을 다음 funny label로 매핑한다.

- `Crunch Boss`
- `Fire Bite`
- `Portion Monster`
- `Wallet Saver`
- `Worth the Wait`
- `Hidden boss`
- `Uncle/ Auntie / Homefeel Energy`
- `Emotional Support Meal`
- `Date Night Certified`
- `Squad Goals`
- `Office Escape Plan`

현재 client report의 keyword chip은 리뷰 원문 token을 TF-IDF성 ranking으로 추출한다. 위 funny label들은 `datasets/derived/hb-score-web-report.json`에서 0건이었다.

관련 근거:

- `scripts/build_hb_score_web_report.mjs`의 `buildKeywordEvidence`는 token count, document frequency, length boost 기반 후보를 뽑는다.
- `client/components/RestaurantReportPanel.tsx`는 `report.keywords`를 그대로 chip으로 보여준다.

### 5. 수동 restaurant-specific funny comments가 report에 없음

Notion 하위 `Madina` 문서에는 특정 식당별로 수동 선별된 funny comments와 keywords가 있다.

- 무탄 코엑스점: `Counterfeit Donggo`, `Couple Alert`, `Netflix connection`, massive portions, unexpected date spot
- 오다리집 간장게장: free items for Google reviews warning, messy in the best way, blew my mind, K-pop too loud, touristy, bottom-tier service
- 홍대 맛집 깃뜰: waitress looks like kpop idol, they cook everything for you, small dog pet friendly, free food for 5-star review, tourist trap, ignored if you do not speak Korean

현재 report payload에는 이런 수동 label이나 editorial comment layer가 없다. 자동 keyword 결과도 `짜장면`, `트러플 짜장면`, `방문해 주셔서` 같은 raw token 중심이라 Notion의 editorial funny keyword 의도와 다르다.

### 6. Keyword-on-map 아이디어가 구현되지 않음

Notion `Emilia (1)`에는 특정 keyword가 리뷰에 나타나면 map에 하나의 큰 fun keyword로 보이게 하자는 아이디어가 있다. 현재 map section은 Kakao 지도 위에 top 50 식당 위치 dot, rank marker, selected popup, district distribution만 제공한다. keyword filter와 map overlay는 연결되어 있지 않다.

관련 근거:

- `client/components/SeoulRestaurantMap.tsx`와 `client/components/KakaoMap.tsx`는 위치 dot 중심이다.
- `client/components/RestaurantReportPanel.tsx`의 keyword chip은 selected report 내부 snippet filter로만 동작한다.

### 7. complimentary/free-review caveat가 limitation에 직접 없음

Notion `Limitations`는 Google Maps reviewer bias와 함께 complimentary review 가능성을 명시한다. 현재 limitation card는 coverage, sampling bias, rating inflation, NLP accuracy, time sensitivity를 다루지만 complimentary/free-review warning은 없다.

이 내용은 `Madina` 하위 문서에서도 `free items for Google reviews`, `free food for 5-star review` 같은 concrete example로 반복된다.

관련 근거:

- `client/components/HiddenBitesExperience.tsx`의 `limitationCards`에는 free-review 또는 complimentary 관련 card가 없다.

### 8. Trial and Error narrative가 독립적으로 보이지 않음

Notion `Trial and Error`는 프로젝트가 `맛집` 기준을 찾다가 top 50 restaurants 분석으로 좁혀진 과정을 단계적으로 설명한다.

- 높은 review count가 곧 맛을 의미하지 않는다는 문제의식
- 서울 전체 식당 리뷰 분석은 현실적으로 불가능했다는 결정
- Naver Map은 promotional review와 star rating 폐지 때문에 한계가 있었다는 경험
- Google은 API/scraping으로 전체 리뷰를 제공하지 않는다는 한계

현재 client에는 이 내용이 Q&A와 limitation에 일부 흩어져 있지만, project process/trial-and-error section으로는 반영되지 않는다.

## 이미 반영된 항목

- Hidden Bites hero와 project identity
- Google top 50 Seoul restaurant 기반 story
- 10개 HB factor와 500개 restaurant-factor score dot
- selected restaurant report
- review adjective/emotion graph section
- keyword chip과 original review snippet filter
- Kakao map 기반 top 50 위치 분포
- coverage, sampling bias, NLP extraction limitation의 큰 방향

## 결론

현재 client는 Notion Documentation의 큰 화면 구조와 데이터 시각화 축은 대부분 구현되어 있다. 그러나 아직 반영되지 않은 것은 화면 구조보다 explanation/editorial layer다. 우선순위는 `HB Score/NLI methodology explainer`, `Unique & Fun Keywords curated taxonomy`, `free-review caveat`, `trial-and-error process section`, `QnA 기간 불일치 정리` 순서가 적절하다.

## 검증

- `client`: `yarn test`
- `client`: `yarn typecheck`
- `client`: `yarn lint`
- `server`: `yarn test`
- `server`: `yarn type-check`
- `server`: `yarn lint`
- repo root: `git diff --check`
