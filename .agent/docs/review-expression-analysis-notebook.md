# 네이버 리뷰 표현 분석 Notebook

## 산출물

- 파일: `notebooks/review-expression-analysis.ipynb`
- 대상 데이터: `datasets/naver-map-reviews-2026-05-13.json`
- 목적: 네이버 지도 리뷰 4091개에서 유저 표현을 추출하고, 유사 의미 cluster와 sparse/dense 표현을 분석한다.

## 분석 방향

현재 corpus는 장소 10개, 리뷰 4091개, 작성 본문 3961개 규모다. Word2Vec을 처음부터 학습하기에는 여전히 과제용 corpus 규모와 품질 검증 범위가 제한적이므로, Word2Vec의 핵심 직관인 co-occurrence를 작은 데이터에 맞게 직접 구현했다.

Notebook은 표현이 등장한 리뷰, 장소, 카테고리, 네이버 키워드, 방문 시간대, 동행 형태, 대기 정보, 방문 목적을 feature로 사용해 co-occurrence vector를 만든다. 이후 cosine similarity가 높은 표현끼리 graph edge로 연결하고, connected component를 표현 cluster로 사용한다.

## Notebook 구성

- Colab 실행용 패키지 설치 셀
- dataset 로드 및 리뷰 단위 flat table 생성
- Kiwi 형태소 분석 기반 원문 token 추출
- 네이버 키워드 anchor expression 보존
- 표현별 리뷰 수, 장소 수, 대표 리뷰 예시 계산
- co-occurrence vector 생성 및 cosine similarity graph 구성
- semantic cluster table 생성
- sparse/dense label 분류
- dense 표현 bar chart
- 장소별 sparse signature table
- 표현 cluster network plot
- 2D SVD scatter plot

## Sparse/Dense 기준

- `dense`: 여러 리뷰와 여러 장소에 반복 등장하고 유사 이웃이 충분한 표현.
- `sparse_meaningful`: 등장 빈도는 낮지만 특정 장소에 몰리고 유사 이웃이 있어 장소별 signature 후보가 되는 표현.
- `sparse_noise`: 1회성이고 유사 이웃이 없어 분석 가치가 낮은 표현.
- `middle`: dense와 sparse로 확정하기 애매한 중간 표현.

기준값은 notebook 상단 상수로 고정했다. 리뷰 수가 늘어나면 `MIN_DENSE_REVIEW_COUNT`, `MIN_DENSE_LOCATION_COUNT`, `SPARSE_MAX_REVIEW_COUNT`, `SPARSE_LIFT_THRESHOLD`, `SIMILARITY_THRESHOLD`를 조정하면 된다.

## 실행 의존성

Notebook은 Colab에서 바로 실행되도록 다음 패키지를 설치한다.

- `pandas`
- `numpy`
- `scikit-learn`
- `matplotlib`
- `networkx`
- `kiwipiepy`
- `koreanize-matplotlib`

로컬 저장소에는 Python 패키지 매니페스트가 없으므로 notebook 내부 설치 셀로 의존성을 관리한다.

## 해석 주의사항

네이버 키워드는 structured signal이라 안정적이지만, 플랫폼이 제공하는 선택지의 편향을 포함한다. 원문 token은 실제 표현을 반영하지만 한국어 형태소 분석과 stopword 설정에 따라 결과가 달라질 수 있다.

Cluster는 정답 label이 아니라 탐색 도구다. 최종 시각화에서는 cluster 결과만 보여주기보다 실제 리뷰 예시를 함께 보여주는 것이 좋다.

## 검증 기록

- JSON dataset 로드 기준 `locations_count == 10`, `reviews_count == 4091`, 작성 본문 리뷰 3961개를 확인했다.
- 이전 500개 dataset 기준으로는 임시 venv에서 notebook code cell을 순서대로 실행해 `expression_stats` 1,128개, `cluster_df` 10개, `signature_df` 10개가 생성되는 것을 확인했다.
- 장소별 최대 500개 dataset 반영 후 notebook 전체 재실행과 threshold 재조정은 별도 후속 작업으로 남아 있다.
- 이전 500개 dataset 기준 density label은 `dense`, `middle`, `sparse_meaningful`, `sparse_noise`로 모두 채워지는 것을 확인했다.
- TypeScript/eslint 설정 파일이나 `package.json`이 없어 TS/eslint 검증 대상은 없다.
