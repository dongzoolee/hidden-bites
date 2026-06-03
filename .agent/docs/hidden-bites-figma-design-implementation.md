# Hidden Bites Figma Design Implementation

## 2026-06-03 Hero title and decoration parity fix

- Hero title이 Figma 첨부 기준보다 절반 폭으로 작게 보이던 원인을 `hero-poster`의 `max-width: 64rem`과 `story-nav` flow margin으로 확인했다.
- Desktop hero에서 `story-nav`를 absolute 배치로 분리해 Figma처럼 micro label이 첫 줄 상단에 오도록 했다.
- `hero-poster`에 `--hero-title-size: clamp(6rem, 20.8vw, 27rem)`와 `--hero-title-line-height: 0.73`을 추가해 2048px viewport에서 title이 Figma crop처럼 화면 대부분을 차지하도록 맞췄다.
- Yellow, green, pink, blue circle/dot mark를 title block 기준 absolute layer로 재배치하고, black square pseudo element도 Figma 비율에 맞춰 키웠다.
- Font ascender가 micro label과 붙지 않도록 title text span만 desktop에서 `translateY`하고, dots와 black square 위치는 Figma crop 기준값에 고정했다.
- Mobile에서는 title span transform을 끄고 black square를 title 안쪽에 배치해 오른쪽 clipping이 생기지 않게 했다.
- Regression guard: `client/test/client-contract.test.mjs`가 hero nav flow 분리, title size variable, black square sizing, four dot coordinates를 검증한다.
- Figma MCP `get_metadata`, `get_screenshot`, read-only `use_figma`는 file `g1aNjTsNQVz5KPEVqMC4qY`, node `313:9287`에서 모두 120초 timeout이 나서, 사용자 첨부 Figma screenshot과 로컬 Playwright 2048x738 screenshot을 기준으로 대조했다.

### 2026-06-03 Hero title scale correction

- `20.8vw` desktop hero title이 실제 웹 viewport에서 과하게 커져 description과 metric chips를 밀어내는 문제가 있었다.
- `--hero-title-size`를 `clamp(5.5rem, 17.2vw, 22rem)`로 낮추고 title span translate, black square, four circle/dot mark size를 같은 비율로 줄였다.
- Desktop poster look은 유지하되 2048x738 viewport에서 title이 화면 전체를 덮지 않고 hero supporting copy가 이어서 읽히도록 조정했다.

### 2026-06-03 Hero title line-height correction

- `17.2vw` title도 여전히 크게 보이고 `0.73` line-height가 두 줄을 과하게 압축해 poster crop처럼 답답하게 보였다.
- `--hero-title-size`를 `clamp(4.8rem, 13.6vw, 17.5rem)`로 더 낮추고 `--hero-title-line-height`를 `0.88`로 올렸다.
- Title span translate, black square, circle/dot mark size를 새 title scale에 맞춰 다시 줄였다.

### 2026-06-03 Hero header parity correction

- Figma node `313:9287` screenshot을 다시 받아 desktop hero 상단이 nav pill이 아니라 `DATA VISUALIZATION PROJECT`와 class meta 한 줄인 것을 확인했다.
- Desktop에서는 `.story-section--hero .story-nav`를 숨기고, mobile에서만 기존 section nav를 유지하도록 했다.
- `.hero-poster .micro-label`을 Figma header처럼 mono font, larger uppercase, flex row, wider gap으로 조정했다.

### 2026-06-03 Global hero header implementation

- User correction clarified that the missing header was the top global header, not the hero meta line.
- Desktop `.story-nav` is visible again with the Figma-style orange `Hidden Bites.` logo and large rounded nav pills.
- Nav labels now match the Figma header sequence: `00 INTRO`, `01 Preview`, `02 Q&A`, `03 HB SCORE`, `04 Emotion Mapping`, `05 REMAPping`, `06 Limitation`.
- Hero meta now uses a black rounded `DATA VISUALIZATION PROJECT` pill followed by `Sogang University Art&Technology`.
- Hero section desktop horizontal padding is fixed to `2rem`, and header links use `nowrap` plus left alignment so the full Figma header fits on one line starting next to the logo at the 1632px reference viewport.

### 2026-06-03 Hero black square removal

- User screenshot showed the decorative black square still visible on the hero surface.
- Removed the `.hero-poster h1::after` pseudo-element that generated the black square on desktop and the matching mobile override.
- Regression guard: `client/test/client-contract.test.mjs` rejects reintroducing `.hero-poster h1::after` while keeping the four colored hero dots.

## 2026-06-03 Figma font-family parity fix

- Figma MCP `use_figma`로 file `g1aNjTsNQVz5KPEVqMC4qY`, node `313:9287`의 text node 478개 typography를 다시 조회했다.
- Figma font family 분포는 `Sora`, `Bowlby One`, `JetBrains Mono`, `Inter`, `Noto Sans KR`, `WAGURI`, `LeeSeoyun`, `AirbnbCereal_W_Bd`, `AirbnbCereal_W_XBd`였다.
- 기존 web client는 `--font-primary`가 `WAGURI` 우선이라 본문, heading, controls 대부분이 Figma의 family hierarchy를 respect하지 못했다.
- `client/app/globals.css`에 Figma 기준 font token을 추가했다.
  - body/default: `Sora`
  - display headings: `Bowlby One` with `WAGURI`/`Noto Sans KR` fallback
  - labels/kickers: `JetBrains Mono`
  - chart/number labels: `Inter`
  - report subheadings/actions: `AirbnbCereal_W_XBd`/`AirbnbCereal_W_Bd`
  - Korean body/fallback: `Noto Sans KR`
  - hand note fallback: `LeeSeoyun`
- `client/app/layout.tsx`는 Google Fonts stylesheet와 `fonts.googleapis.com`/`fonts.gstatic.com` preconnect를 추가했다.
- `LeeSeoyun`은 Noonnu 공식 webfont 경로인 `noonfonts_2202-2@1.0/LeeSeoyun.woff`를 사용한다.
- Regression guard: `client/test/client-contract.test.mjs`가 Figma font token, exact family aliases, Google Fonts stylesheet, 대표 selector별 family mapping을 검증한다.

## 2026-06-03 Kakao map story section

- `The top-50 dots are not spread evenly across Seoul.` 섹션의 SVG projection dot map을 실제 Kakao 지도 기반 구현으로 교체했다.
- `client/components/KakaoMap.tsx`는 `react-kakao-maps-sdk`의 `Map`, `CustomOverlayMap`, `MapTypeControl`, `ZoomControl`, `useKakaoLoader`를 사용해 Top 50 식당 좌표를 실제 Kakao map tile 위에 렌더링한다.
- `client/components/SeoulRestaurantMap.tsx`는 district distribution analysis를 유지하면서 map surface를 `KakaoMap`으로 위임한다.
- `/map` standalone page는 `client/data/top-restaurants-locations.json`의 snake_case 장소 데이터를 `RestaurantSummary` 형태로 normalize해 같은 `KakaoMap` 컴포넌트를 재사용한다.
- Regression guard: `client/test/client-contract.test.mjs`와 `client/test/kakao-map-data.test.mjs`가 Kakao SDK 사용, custom overlay dots, coordinate mapping, SVG map 제거 계약을 검증한다.

### 2026-06-03 Kakao map zoom preservation

- Kakao 지도 위치 dot 클릭 후 selected restaurant state가 바뀔 때 `onCreate`의 `setBounds`가 다시 호출되어 zoom/center가 초기화될 수 있던 흐름을 차단했다.
- `KakaoMap`은 `didFitInitialBoundsRef`로 initial bounds fitting을 최초 1회만 수행하고, 이후 사용자가 조작한 Kakao map zoom/center를 유지한다.
- map dot selection은 `{ targetHash: "map" }`을 전달하고, score plot selection만 `{ scrollToReport: true, targetHash: "report" }`를 사용한다.

## 2026-06-03 Selected dropdown contrast fix

- `Selected:` report heading dropdown이 공통 `.restaurant-select` 규칙에 의해 paper background와 paper text 조합이 되어 글자가 보이지 않던 문제를 수정했다.
- `.selected-heading__select.restaurant-select`를 공통 select 규칙 뒤에 배치해 Figma처럼 orange filled dropdown, paper text, large rounded surface, custom triangle indicator를 유지하도록 했다.
- `client/test/client-contract.test.mjs`에 selected heading dropdown의 cascade order, orange/text contrast, native appearance 제거 계약을 추가했다.

## 2026-06-03 Score mode toggle contrast fix

- `HB Scores` 섹션의 `Scatter` / `Ranked list` toggle이 주황 section background 위에서 active state를 구분하기 어려운 문제를 수정했다.
- `.score-mode-toggle .mini-pill` inactive state는 `var(--paper-soft)` background와 `var(--ink)` text를 쓰고, active state는 `var(--ink)` background와 `var(--paper)` text를 쓰도록 score toggle 범위에만 scoped override를 추가했다.
- `client/test/score-plot-axis.test.mjs`에 score mode toggle inactive/active contrast CSS 계약을 추가했다.

## 2026-06-03 Keyword chip contrast fix

- `The Unique & Fun Keywords`의 selected keyword chip이 `.keyword-chip` 하단 규칙에 의해 active background를 잃고 paper 계열 글자색만 남던 문제를 수정했다.
- `client/app/globals.css`에서 `.keyword-chip.keyword-chip--active`를 keyword base rule 뒤에 배치해 selected chip이 `var(--orange)` background와 `var(--paper)` text color를 유지하도록 했다.
- `client/test/client-contract.test.mjs`에 active keyword chip의 CSS rule order와 색상 계약 회귀 테스트를 추가했다.

## 2026-06-03 구현 내용

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `313:9287`의 긴 발표형 디자인을 메인 `/` 페이지에 반영했다.
- `client/components/HiddenBitesExperience.tsx`를 Figma 흐름에 맞춰 hero, question preview, data-source Q&A, HB Scores, selected report, Seoul dot distribution, limitations, footer 순서의 story page로 재구성했다.
- `client/components/ScorePlot.tsx`에 실제 동작하는 score controls를 추가했다.
  - `ScoreMode`는 `scatter`와 `list`를 지원한다.
  - `FactorWeight` slider 10개를 렌더링하고 factor weight 기반 weighted restaurant score를 client에서 계산한다.
  - scatter mode는 선택 factor의 score 분포를 동적 y-axis로 렌더링하고, list mode는 weighted rank top 12를 표시한다.
  - selected restaurant evaluation card와 top-pick card를 추가했다.
- `client/components/RestaurantReportPanel.tsx`를 Figma의 단일 리포트 카드 구조로 변경했다.
  - emotion chip row, adjective bar graph, keyword chip, review quote grid, restaurant selector를 포함한다.
  - restaurant selector는 50개 restaurant를 전환하며 기존 report query sync를 유지한다.
- `client/components/SeoulRestaurantMap.tsx`를 Figma형 cluster map과 dot distribution analysis panel로 리스킨했다.
  - 기존 SVG projection, 서울 outline, 한강 polyline, 50개 dot, district count 계산은 유지했다.
- `client/components/QnaAccordion.tsx`는 tone별 accordion row와 source comparison card를 지원하도록 확장했다.
- `client/app/globals.css`는 Figma 팔레트와 poster typography, pill nav, thick border, score controls, report card, map/limitations/footer, responsive mobile layout으로 교체했다.

## 회귀 테스트

- `client/test/client-contract.test.mjs`
  - Figma story section, score controls, factor sliders, score mode toggle, report selector, map surface가 유지되는지 검증한다.
  - `Alert.alert`, `as any`, removed loading copy, direct image map 재도입을 막는다.
- `client/test/score-plot-axis.test.mjs`
  - weighted score 계산, `ScoreMode`, `FactorWeight`, slider, scatter/list mode, rank x-axis scale을 검증한다.

## 검증 결과

- `npm --prefix client run test -- --test-reporter=spec`
- `npm --prefix client run typecheck`
- `npm --prefix client run lint`
- `npm --prefix client run build`
- `npm --prefix server run test`
- `npm --prefix server run type-check`
- `npm --prefix server run lint`
- local server `8097`, client `8096` 기동 후 Playwright MCP로 desktop 렌더링과 상호작용을 확인했다.
  - story UI가 loading 없이 렌더링됐다.
  - score section은 10개 slider, scatter/list toggle, top-pick/evaluation card를 렌더링했다.
  - `Ranked list` 전환 후 12개 row가 렌더링됐다.
  - 첫 factor slider 값 변경이 React state label에 반영됐다.
  - selected report는 50개 restaurant selector를 렌더링하고 선택 변경 시 report heading이 갱신됐다.
  - map section은 50개 dot, 7개 district row, selected dot state를 렌더링했다.
- Chrome headless `390x844` screenshot으로 mobile 첫 viewport를 확인했고, nav/title/intro/question preview에서 오른쪽 clipping을 제거했다.

## 운영 메모

- 서버 HTTP API와 dataset schema는 변경하지 않았다.
- GraphQL, Prisma, codegen 변경은 없다.
- Figma MCP의 full design context와 full screenshot은 큰 node 크기 때문에 timeout이 났고, `contentsOnly` screenshot을 기준 시각 자료로 사용했다.
- 첫 client build는 디스크 여유 공간 116MiB 상태에서 `.next` 생성 중 `ENOSPC`로 실패했다. ignored build artifacts와 오래된 `/tmp` EAS/build 임시 디렉터리를 정리한 뒤 동일 build가 통과했다.

## 2026-06-03 Q&A Accordion Transition

- `client/components/QnaAccordion.tsx`는 각 answer panel의 `scrollHeight`를 측정해 `--qna-answer-height` CSS variable로 전달한다.
- `client/app/globals.css`는 `display: none` 토글 대신 `max-height`, `opacity`, `padding`, `transform` transition으로 data-source Q&A accordion의 열림/닫힘 애니메이션을 처리한다.
- `ResizeObserver`와 window resize listener를 함께 사용해 반응형 줄바꿈과 font load 이후에도 answer panel 높이를 다시 맞춘다.
- `prefers-reduced-motion: reduce` 환경에서는 Q&A answer와 chevron transition을 끈다.
- Regression guard: `client/test/client-contract.test.mjs`가 height variable, ResizeObserver, reduced-motion, `display: none` 미사용 계약을 검증한다.
