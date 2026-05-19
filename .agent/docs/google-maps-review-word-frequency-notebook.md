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
- 주석 처리된 URL은 rank 1-50의 최종 `.json` 파일만 사용한다.
- 각 raw URL 바로 위에 `# {rank}위 - {레스토랑명}` 형식의 주석을 넣어 URL을 바꿀 때 어떤 장소 파일인지 확인할 수 있게 했다.

## 2026-05-18 업데이트

- Google Maps review crawl이 rank 1-50 모두 final JSON으로 닫힌 뒤, `notebooks/google-maps-review-word-frequency.ipynb`의 `DATASET_URL` 선택 셀을 최신 final JSON 링크로 갱신했다.
- 활성 URL은 1위 장소 1개만 유지하고, rank 2-50은 레스토랑 이름 주석 아래 주석 처리된 raw GitHub URL로 남겼다.
- 기존 `.partial.json` raw URL 주석은 모두 final `.json` raw URL로 교체했다.

## 2026-05-20 업데이트

- `DATASET_URL` 50개가 macOS 로컬 파일명의 분해형 한글 경로를 percent-encoding해서 GitHub raw에서 404가 나던 문제를 수정했다.
- URL 경로를 Git tree의 조합형 한글 파일명 기준으로 다시 생성했고, 기존처럼 `refs/heads/main` raw GitHub URL 형식을 유지했다.
- `scripts/check_google_maps_review_word_frequency_urls.py`를 추가해 노트북 URL 50개가 Git tree의 final JSON 경로와 일치하고 HTTP 200을 반환하는지 검증할 수 있게 했다.

## 검증

- Notebook JSON 파싱 검증
- Notebook code cell Python 문법 검증
- `nbclient`로 전체 실행 smoke test
- `python3 scripts/check_google_maps_review_word_frequency_urls.py`
