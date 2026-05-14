# Sparse Word Lens Prototype

## 산출물

- 파일: `visualizations/sparse-word-lens.html`
- 형식: 외부 빌드 없이 브라우저에서 바로 열 수 있는 단일 HTML 파일
- 목적: README의 data visualization 목표에 맞춰 sparse word 기반 식당 추천 흐름을 빠르게 확인한다.

## 구현 내용

- `Hidden Bites` 프로젝트의 4,091개 리뷰 분석 결과를 바탕으로 선별한 sparse expression 후보를 HTML 내부 데이터로 포함했다.
- heatmap은 sparse expression과 식당의 signature score 관계를 보여준다.
- `Selected expression` slider는 sparse word를 바꾸며, 왼쪽 evidence와 오른쪽 추천 식당을 동시에 갱신한다.
- `Sparse threshold` slider는 낮은 signature 후보를 숨겨 더 강한 sparse signal만 남긴다.
- `Visit context` segmented control은 `집밥`, `혼밥`, `술`, `데이트`, `힐링`, `빵`, `서비스` 관점으로 후보를 필터링한다.
- 추천 패널은 선택된 sparse word 기준으로 관련 식당, match score, 실제 리뷰 snippet, 해당 식당의 fingerprint를 보여준다.

## 사용 데이터

- 전체 데이터셋 요약 수치: 리뷰 4,091개, 장소 10개, sparse meaningful 표현 446개, word link 13,705개
- 프로토타입에는 전체 446개를 모두 넣지 않고, 이전 sparse word 탐색에서 사람이 선별한 대표 후보를 넣었다.
- 포함 예시: `막걸리식초`, `손맛`, `푸근`, `마라비빔`, `핸드폰 거치대`, `원샷`, `횟감 탱탱함`, `술도둑`, `스키다시`, `쫄바삭`, `피자 챔피언`, `식목일`, `작은 온실`, `참새방앗간`, `치아바타샌드위치`, `부서지다`, `존경하는 선배님`, `칭찬일색`

## 해석 주의사항

- 현재 HTML은 최종 분석 산출물이 아니라 visualization direction을 보여주는 lightweight prototype이다.
- 일부 phrase score는 notebook의 sparse score와 동일한 scale로 수동 정규화한 lens score다.
- 최종 제출용으로 확장할 때는 notebook에서 `analysis_stats`, `sparse_explorer_df`, 리뷰 evidence를 JSON으로 export해 HTML이 같은 metric을 자동으로 읽도록 바꾸는 것이 좋다.

## 검증 메모

- 단일 HTML 파일이므로 별도 dev server 없이 `file://`로 열 수 있다.
- TypeScript 및 eslint 설정 파일이 없는 저장소라 TS/eslint 실행 대상은 없다.
- 2026-05-15 HTML parser 검증과 추출 JavaScript `node --check`를 통과했다.
- Playwright CLI가 `file://` 접근을 막아 렌더링 검증에는 기존 지침의 8085 포트를 사용했다. `http://127.0.0.1:8085/visualizations/sparse-word-lens.html`에서 초기 렌더링, context 버튼, selected expression slider 갱신을 확인했다.
