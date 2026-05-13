# 네이버 지도 리뷰 text 확인 Notebook

## 산출물

- 파일: `notebooks/naver-map-review-text-check.ipynb`
- 대상 데이터: `datasets/naver-map-reviews-2026-05-13.json`

## 목적

수집된 네이버 지도 리뷰 dataset에서 장소명과 리뷰 원문을 빠르게 확인하기 위한 notebook을 추가했다.

## 구성

- Dataset 로드 및 장소 수, 리뷰 수 확인
- 장소별 이름, 분류, 카테고리, 리뷰 수 요약 테이블
- 전체 리뷰 500개의 장소명, 최신순 순번, 방문일, 리뷰 원문 확인 테이블

## 2026-05-13 Dataset 500개 확장 반영

- `datasets/naver-map-reviews-2026-05-13.json`이 장소별 50개, 총 500개 리뷰로 덮어써진 상태를 기준으로 notebook 검증 범위를 갱신했다.
- Colab에서 같은 raw GitHub URL을 로드하면 `locations_count == 10`, `reviews_count == 500` 기준으로 확인한다.

## 구현 기준

Notebook은 별도 패키지 설치 없이 Python 표준 라이브러리와 Jupyter 기본 `IPython.display`만 사용한다. Dataset은 raw GitHub URL에서 직접 fetch한다.

## 2026-05-13 Colab 실행 링크

- Notebook 첫 마크다운 셀 상단에 `Open In Colab` 배지를 추가했다.
- Colab 링크는 `main` 브랜치의 `notebooks/naver-map-review-text-check.ipynb` 경로를 기준으로 연결한다.

## 2026-05-13 Dataset fetch 경로

- Notebook 첫 코드 셀에서 `https://raw.githubusercontent.com/dongzoolee/hidden-bites/refs/heads/main/datasets/naver-map-reviews-2026-05-13.json`를 직접 fetch하도록 변경했다.
- Colab 실행 시 repo clone이나 로컬 상대 경로 없이 dataset을 로드한다.
