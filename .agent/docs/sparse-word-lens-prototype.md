# Sparse Word Lens Prototype

## 산출물

- 파일: `visualizations/sparse-word-lens.html`
- 형식: 외부 빌드 없이 브라우저에서 바로 열 수 있는 단일 HTML 파일
- 목적: README의 data visualization 목표에 맞춰 sparse word 기반 식당 추천 흐름을 빠르게 확인한다.

## 구현 내용

- `Hidden Bites` 프로젝트의 4,091개 리뷰 분석 결과를 바탕으로 선별한 sparse expression 후보를 HTML 내부 데이터로 포함했다.
- heatmap은 sparse expression과 식당의 signature score 관계를 보여준다.
- 9개 keyword만 horizontal rail로 나열하고, keyword hover/focus/click 시 상단의 대표 음식점 이름을 크게 갱신한다.
- hover된 keyword 기준으로 heatmap highlight, 추천 패널, 실제 리뷰 snippet, 해당 식당 fingerprint를 동시에 갱신한다.
- `직원 교육 시급`처럼 부정적인 sparse signal은 긍정 추천이 아니라 `caution` label로 표시한다.

## 사용 데이터

- 전체 데이터셋 요약 수치: 리뷰 4,091개, 장소 10개, sparse meaningful 표현 446개, word link 13,705개
- 프로토타입에는 전체 446개를 모두 넣지 않고, 사용자가 지정한 sparse word lens 9개만 heatmap row로 사용했다.
- 포함 표현: `주문제작을 잘해줘요`, `댄스끝나고 갑니다`, `원샷했어요`, `푸근하다`, `존맛X 손맛O`, `직원 교육 시급`, `대체불가`, `칭찬일색`, `원샷`

## 해석 주의사항

- 현재 HTML은 최종 분석 산출물이 아니라 visualization direction을 보여주는 lightweight prototype이다.
- 일부 phrase score는 notebook의 sparse score와 동일한 scale로 수동 정규화한 lens score다.
- 최종 제출용으로 확장할 때는 notebook에서 `analysis_stats`, `sparse_explorer_df`, 리뷰 evidence를 JSON으로 export해 HTML이 같은 metric을 자동으로 읽도록 바꾸는 것이 좋다.

## 검증 메모

- 단일 HTML 파일이므로 별도 dev server 없이 `file://`로 열 수 있다.
- TypeScript 및 eslint 설정 파일이 없는 저장소라 TS/eslint 실행 대상은 없다.
- 2026-05-15 HTML parser 검증과 추출 JavaScript `node --check`를 통과했다.
- 초기 버전 렌더링 검증에는 기존 지침의 8085 포트를 사용했다. `http://127.0.0.1:8085/visualizations/sparse-word-lens.html`에서 초기 렌더링과 sparse expression 선택 갱신을 확인했다.
- 2026-05-15 heatmap row를 사용자가 지정한 9개 표현으로 제한한 뒤 HTML parser, 추출 JavaScript `node --check`, Playwright 렌더링을 다시 확인했다.
- 같은 검증에서 heatmap이 9개 lens word를 표시하고, `직원 교육 시급` 선택 시 추천 패널이 `77% caution`으로 갱신되는 것을 확인했다.
- 2026-05-15 slider UI를 제거하고 horizontal keyword rail hover 방식으로 변경했다. keyword hover 시 상단 음식점명, heatmap highlight, 추천 패널이 함께 바뀌도록 했다.
- 2026-05-15 변경 후 로컬 JS 검증에서 keyword 9개, keyword-only rail, `대체불가` hover 시 `마더린러 베이글`, `직원 교육 시급` hover 시 `팔로피자`와 `caution signal` 갱신을 확인했다.
