# HB Score Calculation Notebook

## 산출물

- 파일: `notebooks/hb-score-calculation.ipynb`
- full run 출력 경로: `datasets/derived/hb-score-restaurants.json`
- full run audit 출력 경로: `datasets/derived/hb-score-review-factor-scores.csv.gz`

## 목적

Google Maps top 50 restaurant 리뷰를 Hidden Bites factor 기준으로 다시 점수화한다. Web-app에서는 dropdown으로 factor를 선택하고, 식당별 `hb_score`를 y-axis 값으로 사용한다.

## 구현 내용

- `/Users/dongzoolee/Downloads/NLP_Final_Interface.ipynb`의 핵심 방식인 `CrossEncoder("cross-encoder/nli-deberta-v3-large")`와 entailment probability 기반 scoring을 Hidden Bites용으로 이식했다.
- Bible/character CSV, cosine passage search, interactive input loop는 포함하지 않았다.
- 데이터는 `datasets/google-maps-reviews-2026-05-16/`의 final JSON 50개만 사용한다. `.partial.json`과 `run-metadata.json`은 제외한다.
- Colab/local dual path를 지원한다. Colab에서는 repository를 shallow clone하고, local에서는 repo 상대 경로를 우선 사용한다.
- 기본 실행 모드는 `smoke`이며 2개 식당, 식당별 20개 리뷰만 계산한다. `HB_SCORE_SMOKE_RESTAURANT_LIMIT`, `HB_SCORE_SMOKE_REVIEWS_PER_RESTAURANT`로 smoke 크기를 조정할 수 있다. 전체 web-app 산출물은 `HB_SCORE_RUN_MODE=full` 또는 노트북의 `RUN_MODE = "full"`로 실행한다.
- 로컬에서는 기본 NLI device를 `cpu`로 고정한다. Apple MPS에서 `cross-encoder/nli-deberta-v3-large`가 smoke batch만으로도 memory pressure를 만들 수 있어, Colab이 아닌 환경에서는 `HB_SCORE_NLI_DEVICE`를 명시하지 않으면 CPU를 사용한다.
- Colab에서는 device를 자동 선택하고, 로컬 smoke에서는 작은 batch와 짧은 context window를 기본값으로 쓴다. 환경변수 `HB_SCORE_MODEL_BATCH_SIZE`, `HB_SCORE_REVIEW_BATCH_SIZE`, `HB_SCORE_MAX_CONTEXT_CHARS`로 조정할 수 있다.

## Factor Schema

고정 factor는 10개다.

- `taste`: Taste
- `service`: Service
- `value`: Value
- `atmosphere`: Atmosphere
- `accessibility`: Accessibility
- `wait_queue`: Wait/Queue
- `visit_occasion`: Visit Occasion
- `portion`: Portion
- `cleanliness`: Cleanliness
- `signature_uniqueness`: Signature/Uniqueness

각 factor는 English hypothesis 3개를 가진다. 리뷰 premise는 `Focus only on what the reviewer says about the restaurant experience. Review: ...` 형태로 구성한다. Hypothesis는 `The review is about ...` 같은 추상 문장보다 `The reviewer mentions ...`, `The reviewer says ...` 같은 구체 문장형으로 작성했다.

## Scoring Formula

- `factor_relevance`: factor hypothesis 3개의 entailment probability 평균
- `factor_distance`: `1 - factor_relevance`
- `source_rating_for_factor`: 기본적으로 review rating 사용
- `Taste`, `Service`, `Atmosphere`: `meal_type_text`의 `음식:N`, `서비스:N`, `분위기:N`이 있으면 해당 rating 우선 사용
- `review_hb_score`: `source_rating_for_factor * factor_relevance`
- `raw_hb_score`: `sum(review_hb_score) / collected_review_count`
- `count_bonus`: `0.25 * log1p(popularity_count) / log1p(max_popularity_count)`
- `hb_score`: `raw_hb_score + count_bonus`를 `0.00~5.00` 범위로 clip

`popularity_count`는 Google metadata의 `user_rating_count`를 우선 사용하고, 값이 없으면 collected review count로 대체한다.

## Output Shape

`hb-score-restaurants.json`은 다음 구조를 가진다.

- `metadata`: run mode, model name, source review count, scored review count
- `factors`: factor id, label, hypotheses, structured rating label
- `restaurants`: place metadata와 factor별 score map

`restaurants[].scores[factor_id]`는 다음 값을 포함한다.

- `hb_score`
- `raw_hb_score`
- `count_bonus`
- `review_hb_score_sum`
- `mean_factor_relevance`
- `mean_factor_distance`
- `scored_review_count`
- `collected_review_count`

`hb-score-review-factor-scores.csv.gz`는 review-factor 단위 audit table이다. Hypothesis별 상세 entailment list는 CSV에서 제외하고, notebook runtime object에만 남긴다.

## 검증 계획

노트북 내부 regression fixture는 다음 조건을 확인한다.

- 맛 리뷰는 `taste` relevance가 기준 이상이어야 한다.
- 웨이팅 리뷰는 `wait_queue` relevance가 기준 이상이어야 한다.
- review-level score와 restaurant-level `hb_score`는 모두 `0.00~5.00` 범위여야 한다.

로컬 검증은 `/tmp/hidden-bites-hb-score-venv` 임시 venv에서 수행한다.

- notebook JSON 파싱
- code cell Python syntax 검사
- smoke mode NLI 실행
- smoke output schema 검증
- `git diff --check`

현재 repository에는 `package.json`, `tsconfig.json`, eslint 설정이 없어 TypeScript/eslint 실행 대상은 없다.

## 2026-05-27 로컬 smoke 조정

- 최초 smoke 실행에서 모델이 Apple MPS를 자동 선택해 `MPS backend out of memory`로 중단됐다.
- 노트북을 수정해 local 기본 device를 `cpu`로 설정하고, local 기본 NLI batch/context 크기를 줄였다.
- 이 변경은 Colab full run의 GPU 사용을 막지 않는다. Colab에서는 device 자동 선택을 유지한다.
- Regression fixture에서 wait factor가 낮게 잡히던 원인은 추상적인 `review is about ...` hypothesis였다. `The reviewer waited in line...`, `The reviewer mentions a reservation...`처럼 entailment가 잘 잡히는 구체 문장형으로 10개 factor hypothesis를 정리했다.
