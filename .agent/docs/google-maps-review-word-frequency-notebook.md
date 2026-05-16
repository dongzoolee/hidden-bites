# Google Maps Review Word Frequency Notebook

## 산출물

- 파일: `notebooks/google-maps-review-word-frequency.ipynb`
- 대상 데이터: `datasets/google-maps-reviews-2026-05-16/`의 장소별 Google Maps 리뷰 JSON

## 목적

위에서 Google Maps UI로 수집한 리뷰 JSON 중 하나를 raw GitHub URL로 불러와 리뷰 본문에서 자주 등장하는 단어와 2단어 조합을 확인한다.

## 구성

- Colab 실행 badge
- `kiwipiepy`, `pandas`, `matplotlib`, `koreanize-matplotlib` 실행 환경 준비
- `DATASET_URL` 하나만 활성화하고 나머지 수집 JSON raw URL은 주석 처리
- JSON 로드 후 `reviews[].text` 중심의 리뷰 테이블 생성
- Kiwi 기반 한국어 token 추출, 실패 시 정규식 fallback
- 단어별 `total_count`, `review_count`, `review_share`, 예시 리뷰 snippet 계산
- 상위 30개 단어 bar chart
- 연속 2단어 조합 빈도표
- 단어 빈도표와 bigram 빈도표 CSV 저장

## 구현 기준

- 기존 notebook과 동일하게 `https://raw.githubusercontent.com/dongzoolee/hidden-bites/refs/heads/main/...` 형태의 raw GitHub URL을 사용한다.
- 한 번에 여러 장소 파일을 로드하지 않고, `DATASET_URL` 한 줄만 활성화된 상태로 둔다.
- 주석 처리된 URL은 최종 `.json` 파일을 우선 사용하고, 최종 파일이 없는 rank는 `.partial.json`을 사용한다.
- 각 raw URL 바로 위에 `# {rank}위 - {레스토랑명}` 형식의 주석을 넣어 URL을 바꿀 때 어떤 장소 파일인지 확인할 수 있게 했다.

## 검증

- Notebook JSON 파싱 검증
- Notebook code cell Python 문법 검증
- `nbclient`로 전체 실행 smoke test
