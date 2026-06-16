# HB Score tooltip popover

## 2026-06-17 hover popover width guard

- `client/app/globals.css`에서 HB Score Graph 전용 `.score-tooltip`에 `min-width: 10.5rem`과 `width: max-content`를 지정했다.
- 오른쪽 끝 식당 hover popover가 absolute positioning의 shrink-to-fit 계산으로 좁아져 `Rank`, `Taste index`, `HB score`가 한 글자씩 접히는 문제를 막았다.
- `client/components/ScorePlot.tsx`에서 SVG와 popover를 `.score-graph-canvas` 내부에 함께 배치해 모바일 가로 스크롤에서도 같은 좌표계를 사용하도록 했다.
- 우측 끝 dot은 `score-tooltip--left`로 popover가 왼쪽으로 열려 모바일 viewport 밖으로 밀리지 않도록 했다.
- 공통 `.map-tooltip`에는 별도 최소 폭을 주지 않아 지도 tooltip의 기존 폭 동작은 유지했다.
- Regression guard: `client/test/score-tooltip-width.test.mjs`가 `.score-tooltip` 최소 폭, `width: max-content`, canvas 좌표계, 우측 flip class, popover 텍스트 렌더 계약을 검증한다.
