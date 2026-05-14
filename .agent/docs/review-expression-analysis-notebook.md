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

## 2026-05-13 수정 기록

- 표현 cluster network에서 노드 라벨 한글이 네모로 깨지던 문제를 수정했다.
- `koreanize-matplotlib` 적용 후 실제 사용 가능한 한글 폰트 패밀리를 찾아 `matplotlib` 전역 설정에 반영하도록 했다.
- `networkx.draw_networkx_labels`에 동일한 한글 폰트 패밀리를 명시해 NetworkX 라벨이 `DejaVu Sans` 기본값으로 돌아가지 않게 했다.
- 노트북을 재실행해 cluster network 출력 이미지를 갱신했다.

## 2026-05-13 Sparse Explorer 수정 기록

- 5만 리뷰 규모와 sparse expression discovery를 고려해 `sentence-transformers` 기반 로컬 사전학습 embedding을 추가했다.
- 기본 embedding 모델은 `intfloat/multilingual-e5-small`이며, 표현 단위 semantic vector를 생성한다.
- 기존 co-occurrence similarity와 semantic embedding similarity를 `0.55:0.45` 비율로 결합한 `hybrid_similarity` edge 후보 테이블을 추가했다.
- sparse 탐색 기준으로 `rarity_weight`, `hybrid_neighbor_count`, `sparse_signature_score`를 계산한다.
- 7번 시각화는 `ipywidgets`와 `plotly` 기반 sparse signature bar explorer로 바꿨다.
- 8번 시각화는 `ipywidgets`와 `networkx` 기반 sparse expression network explorer로 바꿨다.
- 9번 시각화는 `plotly` 기반 interactive scatter로 바꾸고, hybrid/context/semantic SVD 좌표를 선택할 수 있게 했다.

## 2026-05-15 Sparse Word 탐색 기록

- `/tmp/hidden-bites-notebook-venv`에서 notebook 핵심 code cell을 순서대로 실행해 현재 로컬 dataset 기준 분석 결과를 재생성했다.
- 현재 dataset 기준 결과는 `reviews_df` 4,091행, `expression_stats` 3,287개, `analysis_stats` 3,287개, `edge_df` 13,705개, `sparse_explorer_df` 2,960개다.
- density label은 `sparse_noise` 1,533개, `middle` 936개, `sparse_meaningful` 446개, `dense` 372개로 생성됐다.
- 흥미로운 sparse word 후보는 점수만 보지 않고 실제 리뷰 snippet을 함께 확인했다. 예시는 `손맛`, `막걸리식초`, `푸근`, `댄스끝나면`, `원샷`, `비빔`, `음료수`, `맵찔이`, `거치대`, `술도둑`, `스키다시`, `쫄바삭`, `챔피언`, `화이트 라구`, `식목일`, `온실`, `삭막`, `참새방앗간`, `대체불가`, `치아바타샌드위치`, `뽀드득`, `부서지다`, `흘러나오다`, `존경`, `칭찬일색`이다.
- Notebook 첫 설명의 500개 리뷰 문구를 현재 4,091개 dataset 기준으로 수정했다.

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
- `sentence-transformers`
- `ipywidgets`
- `plotly`

로컬 저장소에는 Python 패키지 매니페스트가 없으므로 notebook 내부 설치 셀로 의존성을 관리한다.

## 해석 주의사항

네이버 키워드는 structured signal이라 안정적이지만, 플랫폼이 제공하는 선택지의 편향을 포함한다. 원문 token은 실제 표현을 반영하지만 한국어 형태소 분석과 stopword 설정에 따라 결과가 달라질 수 있다.

Cluster는 정답 label이 아니라 탐색 도구다. 최종 시각화에서는 cluster 결과만 보여주기보다 실제 리뷰 예시를 함께 보여주는 것이 좋다.

## 검증 기록

- JSON dataset 로드 기준 `locations_count == 10`, `reviews_count == 4091`, 작성 본문 리뷰 3961개를 확인했다.
- 이전 500개 dataset 기준으로는 임시 venv에서 notebook code cell을 순서대로 실행해 `expression_stats` 1,128개, `cluster_df` 10개, `signature_df` 10개가 생성되는 것을 확인했다.
- 장소별 최대 500개 dataset 반영 후 2026-05-15에 notebook 핵심 code cell을 재실행해 현재 threshold에서 sparse explorer 결과가 정상 생성되는 것을 확인했다.
- 이전 500개 dataset 기준 density label은 `dense`, `middle`, `sparse_meaningful`, `sparse_noise`로 모두 채워지는 것을 확인했다.
- TypeScript/eslint 설정 파일이나 `package.json`이 없어 TS/eslint 검증 대상은 없다.
- 2026-05-13 `/tmp/hidden-bites-notebook-venv` 임시 환경에서 `nbclient`로 `notebooks/review-expression-analysis.ipynb` 전체를 재실행했고, 표현 cluster network 출력에서 한글 라벨이 정상 표시되며 `Glyph ... missing from font(s) DejaVu Sans` warning이 더 이상 발생하지 않는 것을 확인했다.
- 2026-05-13 sparse explorer 수정 후 `/tmp/hidden-bites-notebook-venv`에서 노트북 code cell 소스를 직접 실행해 `expression_stats` 3,287개, `analysis_stats` 3,287개, `edge_df` 13,705개, `signature_df` 10개, `sparse_explorer_df` 2,960개, `coordinate_df` 3,321개 생성을 확인했다.
- 같은 검증에서 `plot_sparse_signature_bar`, `plot_sparse_network`, `plot_sparse_scatter` 호출이 모두 성공했다.
- 로컬 Python 3.14 `nbclient` 커널 실행은 `%pip` 제외 복사본에서도 idle 후 `DeadKernelError`로 중단되어, full notebook 저장 실행 대신 동일 셀 소스 직접 실행으로 검증했다. Colab/Jupyter 대상 notebook 코드는 유지했다.
- 2026-05-13 Colab의 `Created using Colab` 커밋이 원격 `main`의 노트북을 slider 구현 전 정적 그래프 버전으로 덮어쓴 것을 확인했다. `origin/main`을 fast-forward한 뒤 sparse explorer 노트북 구현을 다시 적용했다.
