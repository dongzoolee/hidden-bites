# Score heading copy

## 2026-06-14 HB Scores slider prompt correction

- `client/components/HiddenBitesExperience.tsx`의 HB Scores intro에서 `Drag a slider` 문구를 underline 처리했다.
- `</strong>{" "}The chart...` 형태로 JSX 공백을 명시해 `slider.The`처럼 붙어 보이지 않도록 했다.
- Regression guard: `client/test/score-heading-copy.test.mjs`가 underline markup과 explicit trailing space contract를 검증한다.

## 2026-06-14 HB Score Q&A answer correction

- Notion `HB Score` 문서의 계산 계약을 기준으로 `What is the HB Score?` 답변을 짧은 한 문단으로 교체했다.
- 새 답변은 NLI 기반 factor relevance, review rating weighting, small review-volume reliability bonus만 설명한다.
- 기존 slider/leaderboard 조작 설명과 adjective/keyword frequency 중심 문구는 제거했다.
- Regression guard: `client/test/qna-figma-accordion.test.mjs`, `client/test/qna-hb-score-copy.test.mjs`가 새 문구와 제거된 문구를 함께 검증한다.
