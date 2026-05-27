# HB Score Factor Explorer Notebook

## 산출물

- 파일: `notebooks/hb-score-factor-explorer.ipynb`
- 입력 데이터: `datasets/derived/hb-score-restaurants.json`
- Colab raw 입력: `https://raw.githubusercontent.com/dongzoolee/hidden-bites/main/datasets/derived/hb-score-restaurants.json`

## 목적

`hb-score-calculation.ipynb`에서 capstone full run으로 생성한 restaurant-factor score를 다시 계산하지 않고, factor 선택에 따라 restaurant ranking graph가 어떻게 바뀌는지 빠르게 확인한다.

## 구현 내용

- 첫 셀에 `Open In Colab` badge를 추가했다.
- 로컬 Jupyter에서는 repository 내부 `datasets/derived/hb-score-restaurants.json`을 우선 로드한다.
- Colab에서는 GitHub raw URL에서 같은 JSON을 로드한다.
- 로드 직후 `run_mode == "full"`, restaurant 50개, factor 10개를 검증한다.
- JSON의 `restaurants[].scores[factor_id]` 구조를 restaurant-factor flat table로 변환한다.
- `ipywidgets` dropdown/slider와 `plotly` horizontal bar chart를 연결했다.

## Widget 구성

- `factor`: 10개 Hidden Bites factor 선택
- `metric`: `hb_score`, `raw_hb_score`, `mean_factor_relevance`, `mean_factor_distance`
- `top n`: 5~50 범위
- `sort`: 선택 metric 내림차순 또는 Google place rank 순

식당명이 길기 때문에 vertical bar chart 대신 horizontal bar chart를 기본으로 사용한다. Hover에는 식당명, rank, Google rating, collected review count, 선택 metric, HB score, raw HB score, count bonus를 표시한다.

## 검증 계획

- notebook JSON 파싱
- code cell Python syntax 검사
- 입력 JSON 로드 및 metadata 검증
- 모든 restaurant에 10개 factor score가 존재하는지 확인
- 모든 `hb_score`가 `0.00~5.00` 범위인지 확인
- 기본 `taste` / `hb_score` figure가 Plotly bar trace 1개와 top 20 row를 생성하는지 확인
- `git diff --check`

현재 repository에는 `package.json`, `tsconfig.json`, eslint 설정이 없어 TypeScript/eslint 실행 대상은 없다.

## 2026-05-27 검증 결과

- `notebooks/hb-score-factor-explorer.ipynb` JSON 파싱과 code cell syntax 검사를 통과했다.
- `/tmp/hidden-bites-hb-factor-venv` 임시 venv에서 `pandas`, `plotly`, `ipywidgets`를 설치하고 핵심 셀 dry-run을 실행했다.
- dry-run 결과 `rows=500`, 기본 `taste` / `hb_score` figure point `20`, ranking table row `20`을 확인했다.
- 입력 데이터는 `run_mode=full`, restaurant 50개, factor 10개, 모든 `hb_score` `0.00~5.00` 범위를 만족했다.
