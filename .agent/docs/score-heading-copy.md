# Score heading copy

## 2026-06-14 HB Scores slider prompt correction

- `client/components/HiddenBitesExperience.tsx`의 HB Scores intro에서 `Drag a slider` 문구를 underline 처리했다.
- `</strong>{" "}The chart...` 형태로 JSX 공백을 명시해 `slider.The`처럼 붙어 보이지 않도록 했다.
- Regression guard: `client/test/score-heading-copy.test.mjs`가 underline markup과 explicit trailing space contract를 검증한다.
