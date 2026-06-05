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

## 2026-06-05 Hero and preview collage update

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `313:9287`의 업데이트된 Hero/Preview 영역을 먼저 반영했다.
- Hero description을 `Google's top-50 restaurants in Seoul, re-scored by the factors people actually mention in their reviews.`로 맞췄다.
- Hero metric chip의 세 번째 항목을 `10 factors`에서 `NLP adjectives + keywords`로 변경했다.
- Preview 영역의 단순 3-card placeholder를 Figma poster collage 구조로 교체했다.
  - `Mutan COEX Store` dark report card
  - `Jongno Naengmyeon 74.0` yellow score badge
  - scatter chart preview
  - score controls preview
  - Seoul dot map preview
- 실제 map section은 사용자 확인에 따라 Kakao 지도 구현을 유지했다. Preview collage 안의 map은 Figma poster 미리보기용 장식 surface로만 사용한다.
- Mobile에서는 collage 요소를 static stack으로 전환해 카드 겹침과 text clipping을 방지했다.
- Regression guard: `client/test/hero-preview-collage.test.mjs`가 hero copy, metric chip, collage class, old 3-card placeholder 제거, mobile stack CSS를 검증한다.

### 2026-06-05 Hero metric chip color correction

- Hero metric chip `50 restaurants`, `5-yr review window`, `NLP adjectives + keywords`는 leading token만 exact `#FF5A1F`로 맞췄다.
- Leading token `50`, `5-yr`, `NLP`의 font weight를 Figma 기준 `800`으로 명시했다.
- 나머지 label text는 black text를 유지한다.
- Chip label은 별도 inline label로 분리하고 각 chip에 readable `aria-label`을 둔다.
- Hero metric chip background는 기존 shared pill surface를 유지한다.
- Regression guard: `client/test/hero-preview-collage.test.mjs`가 hero metric chip의 `strong` token split, exact token color, weight, background override 미사용을 검증한다.

### 2026-06-05 Question preview title and asset correction

- Question card title은 `What are the real factors behind a great 맛집?` sentence case를 유지하고 CSS uppercase transform을 제거했다.
- Question card title은 desktop/mobile 모두 two-line composition 안에 끝나도록 question 전용 font, line-height, max-width, desktop/mobile font-size를 조정했다.
- 하단 5개 preview component는 React/CSS 근사 구현을 제거하고 Figma에서 추출한 PNG visual asset으로 교체했다.
- `client/public/figma/question-preview-collage.png`는 Figma composition을 따라 evaluation card, score badge, score graph, score controls, Seoul dot map을 한 장의 1280x340 visual asset으로 제공한다.
- Question card title의 Korean word `맛집`은 WAGURI span으로 분리해 Figma Korean display font를 적용했다.
- Regression guard: `client/test/hero-preview-collage.test.mjs`가 sentence-case title, PNG asset dimensions, old five-component DOM/CSS 제거를 검증한다.

## 2026-06-05 QnA section update

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `313:9287`의 업데이트된 QnA 섹션을 반영했다.
- Section copy를 `Before we re-score, the two doubts that come up first — why Google Maps, and how we narrowed the city down to fifty.`로 맞췄다.
- `QnaAccordion`은 closed state에서 `Q1/Q2/Q3`, open state에서 `A1/A2/A3` prefix를 보여준다.
- Google Maps, Naver Map, Kakao Map 비교 카드는 Figma의 concise English comparison copy를 렌더링한다.
- Google Maps card는 dark featured variant로 구분하고, card meta row를 추가했다.
- Top 50 설명은 별도 formula pill로 `score(r_k) = 0.55 · log(reviews_5y) + 0.45 · stars · sqrt(reviews_30d)`를 표시한다.
- `What is the HB Score?` answer는 slider 조작에 따라 top-50 leaderboard가 재정렬되는 설명으로 교체했다.
- QnA CSS는 Figma처럼 border 없는 large rounded accordion, larger prefix badge, metadata typography, mobile-safe formula wrapping으로 조정했다.
- Regression guard: `client/test/qna-figma-accordion.test.mjs`가 Q/A prefix, exact Figma copy, platform meta, formula pill, old fallback copy 제거, mobile QnA CSS를 검증한다.

### 2026-06-05 QnA platform card parity correction

- User가 다시 제공한 Figma node `313:9287`의 전체 metadata/design context/screenshot과 read-only inspection은 120초 timeout이 발생했다.
- 첨부된 Figma crop을 기준으로 Q1의 Google Maps / Naver Map / Kakao Map 비교 카드를 다시 맞췄다.
- Platform card의 이전 meta row와 한국어 body copy를 제거하고, Figma crop의 영어 문구와 quoted Naver/Kakao 설명을 반영했다.
- Platform card body는 원문 `body`를 유지하면서 Figma crop과 같은 두 줄 구성을 위해 `bodyLines`를 추가하고, line span을 nowrap으로 렌더링한다.
- Platform card body font는 Figma crop의 line width에 맞도록 기존 `Airbnb Cereal` webfont를 사용한다.
- Card title 앞 원형 marker를 CSS pseudo-element로 추가하고, desktop에서 Figma 비율에 맞게 card radius, min-height, padding, title/body font-size, row gap을 clamp 값으로 조정했다.
- QnA answer의 platform card row는 더 이상 prefix 영역이나 section padding 안쪽에 갇히지 않도록 desktop에서 viewport full-bleed로 배치하고, answer paragraph만 desktop에서 들여쓰기한다.
- Mobile에서는 card stack 시 title marker, title/body font-size, padding, paragraph indent를 줄이고 `bodyLines` nowrap을 해제해 text clipping을 방지한다.
- Regression guard: `client/test/qna-figma-accordion.test.mjs`가 exact platform copy, old meta/Korean copy 제거, marker pseudo-element, Figma crop card sizing, mobile override를 검증한다.

### 2026-06-05 Formula pill radius and typography correction

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `238:3325`를 `get_design_context`와 screenshot으로 재확인했다.
- Formula pill은 Figma 기준 background `#fff1da`, radius `20px`, padding `18px 20px`, gap `6px`, max width `679px`로 조정했다.
- `Formula` label은 JetBrains Mono regular 16px, tracking 0.44px, color `#949494`로 맞췄다.
- 수식 본문은 JetBrains Mono bold 16px, tracking 0.44px, color `#8b2415`로 맞추고 Figma 표기인 `score(rₖ) ... √reviews_30d`를 사용한다.
- Desktop에서는 수식을 한 줄로 유지해 Figma의 679px by 84px pill 비율을 보존하고, mobile media query에서만 wrapping을 허용한다.
- Regression guard: `client/test/qna-figma-accordion.test.mjs`가 formula pill의 exact radius, padding, typography, color, expression을 검증한다.

### 2026-06-05 Question preview PNG export

## 2026-06-05 HB Score graph Figma reimplementation

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `309:7952`를 `get_design_context`, `get_metadata`, `get_screenshot`으로 확인해 HB Score graph 컴포넌트를 다시 구현했다.
- `client/components/ScorePlot.tsx`는 Figma의 856x717 rounded graph card 구조로 교체했다.
- Scatter mode는 Figma 기준 SVG plot `784x500`, plot area `x=35..771`, `y=39..448`, x ticks `0/25/50/75/100`, y labels `4.96/4.93/4.90/4.87/4.83`를 사용한다.
- x-axis selector는 Figma의 `x: Taste ->` label처럼 보이되 클릭하면 다음 factor로 순환한다.
- dot은 선택 factor score를 35~100 index로 펼치고, 전체 HB score index를 4.83~4.96 범위에 정규화해 Figma처럼 restaurant dots가 plot 안에 넓게 분포하도록 했다.
- Top pick pill, crown label, bottom instruction, Scatter/Ranked list segmented buttons를 Figma 색상과 typography에 맞췄다.
- Ranked list mode는 같은 card 내부에서 50개 restaurant row를 scrollable list로 보여주며 기존 report 선택/scroll 동작은 유지한다.
- Regression guard: `client/test/score-plot-axis.test.mjs`가 Figma chart dimensions, card radius/padding, tick labels, top callout, dot classes를 검증한다.
- Regression guard: `client/test/score-plot-report-scroll.test.mjs`가 dot/list selection의 report scroll 계약을 검증한다.
- Browser verification: localhost `8096`에서 desktop card `856x717`, plot `784x500`, dots `50`개, Ranked list `50` rows, factor cycle, mobile card `358px` width와 plot horizontal scroll을 확인했다.

### 2026-06-05 HB Score surrounding cards restoration

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `309:7856`을 다시 확인해 graph가 포함된 전체 `Section - 5-2 HB Scores` 구조를 기준으로 복구했다.
- `ScorePlot`에 사라졌던 오른쪽 `Score controls` card, `Top pick right now` card, 하단 `Individual evaluation` card, `Go to Report` button을 다시 추가했다.
- Slider와 factor chip은 실제 state에 다시 연결했다.
  - x-axis factor chip을 누르면 graph x-axis가 변경된다.
  - factor weight slider를 움직이면 weighted top pick, ranked list, highlighted top dot이 다시 계산된다.
  - dot/list/report button 선택은 기존처럼 report section으로 smooth scroll한다.
- Figma layout 기준으로 score area는 desktop에서 `856px graph + 24px gap + 400px controls` = `1280px` grid를 사용하고, evaluation card는 전체 폭을 차지한다.
- 1380px 이하와 mobile에서는 graph, controls, top-pick, evaluation card가 세로 stack으로 내려가도록 responsive override를 추가했다.
- Mobile에서는 graph SVG의 내부 scroll 때문에 grid item이 768px로 밀려나지 않도록 `score-graph-card`, `score-graph-content`, `evaluation-card`에 `min-width: 0` guard를 추가했다.
- Score section과 QnA copy는 slider 기반 설명으로 되돌렸다.
- Regression guard: `client/test/score-plot-axis.test.mjs`가 graph-only 회귀를 막기 위해 `score-controls`, `factor-weight-slider`, `top-pick-card`, `evaluation-card`, `report-jump` 존재, Figma card dimensions, mobile width guard를 검증한다.

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `309:7782`를 `get_design_context`와 `get_screenshot`으로 확인했다.
- 해당 노드는 evaluation card, score badge, score graph, score controls, Seoul dot map이 겹친 preview collage이며 직접 React/CSS로 재구현하지 않았다.
- Figma MCP screenshot export 원본은 PNG `1280 x 340`으로 내려받아 `client/public/figma/question-preview-collage.png`에 배치했다.
- `HiddenBitesExperience` preview 영역은 SVG/vector 구현 대신 `<img src="/figma/question-preview-collage.png">`를 렌더링한다.
- 2026-06-05 추가 보정으로 `/Users/dongzoolee/Downloads/localhost_8096__place=ChIJlQqAYNelfDURg2zfveD4eW4.png` fullsize screenshot에서 visible preview 영역을 `2730 x 727`으로 crop해 같은 PNG 자산을 교체했다.
- `client/app/globals.css`의 preview asset 비율은 screenshot crop 크기에 맞춰 `2730 / 727`로 조정하고, 이미 visible 영역으로 잘린 crop이라 asset width는 `100%`로 배치한다.
- Regression guard: `client/test/hero-preview-collage.test.mjs`가 PNG signature, width/height, PNG 경로, SVG 미참조 계약을 검증한다.

### 2026-06-05 Score graph card correction

- `ScorePlot`은 Figma 본문 그래프 카드와 score controls/top-pick/evaluation cards를 함께 렌더링한다.
- `ScoreMode`는 `scatter`와 `list`를 지원하며, scatter mode는 `4.83`부터 `4.96`까지 고정된 HB score y-axis와 선택 factor 기반 x-axis index를 사용한다.
- `score-axis-selector`는 현재 x-axis factor label을 표시하고 클릭할 때 다음 factor로 순환한다.
- `score-top-callout`은 현재 top score dot 위에 yellow callout을 배치하고, list mode는 같은 score rows를 `score-ranked-list`로 보여준다.
- Score dot과 ranked-list row 선택은 `{ scrollToReport: true, targetHash: "report" }`로 selected report section에 연결된다.
- Mobile에서는 graph SVG에 horizontal scroll을 허용하되 card 자체는 viewport 안에 남기고, ranked-list의 보조 factor column을 숨겨 clipping을 막는다.
- Regression guard: `client/test/score-plot-axis.test.mjs`, `client/test/score-plot-report-scroll.test.mjs`, `client/test/client-contract.test.mjs`가 graph-card, axis selector, fixed axis domain, ranked list, report scroll selection 계약을 검증한다.

### 2026-06-05 Map section Figma copy correction

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `309:8357`의 Section `5 — 4 · WHERE ARE THEY LOCATED`를 `get_design_context`와 `get_screenshot`으로 확인했다.
- Map section kicker가 background와 같은 red 계열이라 보이지 않던 문제를 `var(--yellow)`로 보정했다.
- Section title을 Figma copy `THE TOP-50 DOTS / ACROSS SEOUL.`로 교체하고 `TOP-50 DOTS`만 yellow accent로 처리했다.
- Section description을 Figma 문구인 tourism, shopping, office, nightlife cluster 설명과 Myeongdong/Euljiro, Hongdae, Gangnam/COEX, Seongsu, Itaewon, Daehakro 나열로 맞췄다.
- Kakao map 구현은 유지하면서 map card 상단에 `Top 50 Restaurant in Seoul` title overlay를 추가했다.
- Analysis card title은 `Dot Distribution`과 `Analysis` 두 줄 span으로 고정했다.
- Analysis card body, dense-area note, `n = Google top-50 · ranked by review count × stars · 5-yr window` source note를 Figma copy로 교체했고 source note는 card 하단으로 밀리도록 flex column과 `margin-top: auto`를 사용했다.
- `map-heading p`는 공통 `white-space: nowrap` 영향을 받지 않도록 `white-space: normal`을 명시했다.
- Regression guard: `client/test/map-section-figma-copy.test.mjs`가 section kicker, title accent, description, analysis card copy, two-line title, source note placement, CSS grid/radius/typography contract를 검증한다.
- Verification:
  - `yarn --cwd client test -- --test-reporter=spec`
  - `yarn --cwd client typecheck`
  - `yarn --cwd client lint`
  - `yarn --cwd client build`
- Browser plugin validation은 `8096` client와 `8097` backend가 실행 중인 상태에서 시도했으나 in-app browser가 React client hydration 전에 loading state에 머물러 실제 visual 확인까지 진행하지 못했다. API proxy와 backend 응답은 `curl http://127.0.0.1:8096/api/summary`, `curl http://127.0.0.1:8097/api/summary`로 정상 확인했다.

### 2026-06-05 Fullsize crop and remaining section parity

- `question-preview-collage.png`는 fullsize page screenshot crop 원본을 유지하며 browser 검증에서 `naturalWidth: 2730`, `naturalHeight: 727`, rendered `1278 x 340`, `aspect-ratio: 2730 / 727`, horizontal overflow 없음으로 확인했다.
- Selected report heading은 native select 대신 keyboard-accessible custom dropdown을 사용하고, option active/selected state는 yellow highlight로 맞췄다.
- Selected report panel은 Figma report card에 맞춰 emotion chip row, percent graph, keyword chips, snippet grid, explore-another action을 렌더링한다.
- Map, limitations, footer 섹션은 Figma copy hierarchy와 line break rhythm을 맞추고 각각 전용 regression test를 추가했다.
- Final validation:
  - `yarn test`
  - `yarn typecheck`
  - `yarn lint`
  - `yarn build`
  - Browser MCP `http://localhost:8096/?place=ChIJlQqAYNelfDURg2zfveD4eW4` runtime check

### 2026-06-05 Footer Figma parity correction

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `309:8559`의 footer frame을 `get_design_context`와 `get_screenshot`으로 확인했다.
- Footer title `HIDDEN BITES.`는 Figma 기준 `300px / 262.4px` 비율에 맞춰 `.story-footer h2` 전용 `line-height: 0.875`로 분리했다.
- Footer title font-size는 desktop Figma 기준 1440px viewport에서 300px까지 커지도록 `clamp(5.4rem, 20.83vw, 18.75rem)`로 조정했다.
- Footer meta는 Figma의 `The team`, `The class`, `The story` 3컬럼 내용으로 교체했다.
  - `dongzoolee (developer) / me@leed.at`
  - `Eunhong Kim (designer) / its4hong@gmail.com`
  - `Madina / abc@gmail.com`
  - `Emilia / abc@gmail.com`
  - `26-1 Data Visualization`, `Sogang University · Art & Technology`, `advised by Prof. JeeWon Kim`
  - `web-desktop edition · 2026.05 · vol.01`
- Footer meta typography는 Figma 기준 heading `11px`, body `14px / 22.4px`, column gap `32px`, top border padding `37px`로 조정했다.
- Mobile에서는 team grid를 1컬럼 member stack으로 풀어 좁은 화면에서 email과 role이 clipping되지 않도록 했다.
- Browser validation: `localhost:8096`에서 Playwright Chromium `1440x900` screenshot을 캡처해 footer title 줄 간격과 3컬럼 team/class/story copy가 렌더링되는 것을 확인했다.
- Regression guard: `client/test/footer-figma-parity.test.mjs`가 footer title line-height, Figma meta copy, typography, mobile override를 검증한다.

### 2026-06-05 Limitation cards Figma parity correction

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `309:8515`의 `Section - 5-5 Limitations`를 `get_design_context`, `get_metadata`, `get_screenshot`으로 확인했다.
- Limitation description은 Figma처럼 `Five honest disclaimers.`와 `Every visualization above sits inside the boundaries described below.`를 별도 line span으로 분리했다.
- `limitationCards`의 01~05 copy를 Figma 원문 line stack으로 교체했다.
  - 01 Coverage: top-50 only와 sample 밖의 long tail 설명
  - 02 Sampling bias: tourist language overrepresentation과 Korean local under-weighting 설명
  - 03 Rating inflation: tourism zone novelty/rating inflation 설명
  - 04 NLP accuracy: slang, sarcasm, multilingual review, model dependency 설명
  - 05 Time sensitivity: single crawl point와 chef/price/line 변동 설명
- Card layout은 Figma 기준 1280px container, 5-column grid, 18px gap, 303px min-height, 28px radius, 26px/25px/28px padding으로 조정했다.
- Card typography는 number `Bowlby One 56px`, title `Bowlby One 22px`, body `Sora 14px / 21px`로 맞췄다.
- Card colors는 Figma exact 값 `#ffc842`, `#ff8fb1`, `#fff1da`, `#3da06b`, `#1a1310`을 사용하고, 04/05 number accent는 각각 `#ffc842`, `#ff5a1f`로 맞췄다.
- Mobile에서는 Figma line stack을 유지하되 nowrap을 해제해 text clipping을 방지했다.
- Regression guard: `client/test/limitations-figma-layout.test.mjs`가 description line break, exact copy lines, card grid geometry, exact colors, typography, mobile nowrap override를 검증한다.

### 2026-06-05 Selected report section Figma parity correction

- Figma file `g1aNjTsNQVz5KPEVqMC4qY`, node `309:8109`의 5-3 report section을 `get_design_context`, `get_metadata`, `get_screenshot`으로 다시 확인했다.
- `Selected:` 바로 아래 native `<select>`를 제거하고 직접 구현한 `SelectedRestaurantDropdown` listbox로 교체했다.
  - button surface는 Figma의 orange rounded dropdown처럼 유지한다.
  - listbox option font-size는 16px로 고정해 browser native select option이 title font-size를 상속해 커지는 문제를 없앴다.
- `Explore another restaurant`는 restaurant selector가 아니라 button으로 바꾸고, 클릭 시 `selected-restaurant-picker`로 smooth scroll 후 dropdown button에 focus한다.
- `RestaurantReportPanel` header는 restaurant name title 아래에 restaurant info row를 배치하고, right-most rating block은 실제 `★★★★★`와 Figma에서 확인한 `Bowlby One` display rating을 사용한다.
- `The Review Adjectives` subtitle은 Figma copy인 `Macro analysis: Categories were defined by selecting the top 10 most frequent adjectives for each emotion.`으로 맞췄고, `by selecting the top 10 most frequent adjective` 구간은 bold underline 처리했다.
- Emotion graph는 현재 derived report schema가 제공하는 5개 emotion bucket을 보존하면서 Figma의 graph header, y-axis ticks, grid lines, rounded bars, diamond markers, emoji/English/Korean labels 구조로 재구성했다.
- `The Unique & Fun Keywords` subtitle에서 `Click a keyword chip`을 bold underline 처리했다.
- Review quote grid는 2x2 layout, 22px radius, Figma tone colors를 사용하고 footer는 author/rating metadata 대신 `KEYWORD: a · b · c` 형태로 렌더링한다.
- Regression guard: `client/test/report-section-figma-parity.test.mjs`가 selected dropdown, explorer button scroll/focus, report header/rating typography, adjective subtitle, emotion graph structure, keyword subtitle, snippet footer/radius를 검증한다.
