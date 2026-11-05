# Hidden Bites Web Client, Backend, Deploy

## 목적

Hidden Bites는 Next.js static export client 단독 구조다. 초기에는 NestJS read-only REST backend를 함께 두었으나 2026-11-06에 제거하고 정적 JSON 파일로 대체했다(아래 `2026-11-06 Backend 제거` 참고). Figma `g1aNjTsNQVz5KPEVqMC4qY`, node `192:45` wireframe을 MCP로 확인했고, 사용자가 확정한 3개 `100svh` 화면 구조에 맞춰 hero/QnA, HB Scores, selected restaurant report를 한 페이지 scroll-snap UI로 구현했다.

## Client

- 경로: `client/`
- Stack: Next.js App Router, React 19, TypeScript strict, ESLint flat config, Yarn lockfile
- Static export output: `client/client-build`
- Data: same-origin static JSON `/data/summary.json`, `/data/hb-scores.json`, `/data/restaurants.json`, `/data/reports/<placeId>.json`
- UI:
  - `intro`: Hidden Bites title, class/meta, description, Seoul top restaurant map preview, QnA accordion
  - `scores`: 10 factor filters, 500-dot HB score scatter plot, selected restaurant query param sync
  - `report`: selected restaurant summary, factor bars, adjective/emotion stack, keyword chips, review snippets
- Layout:
  - desktop/mobile section height is fixed at `100svh`
  - mobile sections use internal vertical scroll when needed
  - score chart uses horizontal overflow only inside the chart on narrow screens

## Backend (2026-11-06 제거됨, historical)

- 경로: `server/` (삭제됨)
- Stack: NestJS REST API, TypeScript strict, ESLint flat config, Yarn lockfile
- Port: `8097`
- Endpoints:
  - `GET /health`
  - `GET /api/summary`
  - `GET /api/hb-scores`
  - `GET /api/restaurants`
  - `GET /api/restaurants/:placeId/report`
- Canonical data:
  - `datasets/derived/hb-score-restaurants.json`
  - `datasets/derived/hb-score-factor-restaurant-points.json`
  - `datasets/derived/hb-score-web-report.json`
- Report generation:
  - `scripts/build_hb_score_web_report.mjs`
  - `scripts/validate_hb_score_web_report.mjs`
  - raw Google review JSON에서 emotion/adjective count, TF-IDF 계열 keyword ranking, keyword evidence snippets를 deterministic derived payload로 생성한다.

## Deploy / CI

- NLP-Biblabely workflow 구조를 따라 reusable workflows를 추가했다.
  - `.github/workflows/build-client.yml`
  - `.github/workflows/build-server.yml`
  - `.github/workflows/deploy.yml`
  - `.github/workflows/release-deploy.yml`
- Client deploy:
  - S3 bucket: `hidden-bites-production`
  - S3 prefix: `client-build`
  - CloudFront function: `.github/cloudfront/viewer-request.js`
  - SPA route는 `/client-build/index.html`, static asset은 `/client-build/*`로 rewrite한다.
  - `/api/*`와 `/health`는 rewrite하지 않고 backend origin behavior로 넘긴다.
- Server deploy:
  - ECR repo: `hidden-bites-server`
  - container name: `hidden-bites-server`
  - container port: `8097`
  - Docker image는 root context에서 `server/Dockerfile`로 build한다.
- Nginx 참고 설정:
  - `infra/nginx/hidden-bites.conf`
  - CloudFront backend origin에는 `/api/*`와 `/health` behavior가 모두 필요하다.

## Local Verification

- Data regression:
  - `node scripts/validate_hb_score_web_report.mjs`
  - 확인: 50 restaurants, 10 factors, 500 points, 50 reports, score range `0..5`, keyword/snippet/emotion bucket payload
- Backend:
  - `yarn type-check`
  - `yarn lint`
  - `yarn test`
  - `yarn build`
  - 테스트 4개 통과: health, summary/scores/restaurants/report success, missing report 404
- Client:
  - `yarn typecheck`
  - `yarn lint`
  - `yarn test`
  - `yarn build:web`
  - 테스트 1개 통과: QnA, HB Scores, selected report, keyword snippet surface contract
- Deploy scripts:
  - `node .github/cloudfront/viewer-request.test.js`
  - `sh .github/scripts/validate-release-deploy-workflow.sh`
  - `bash -n .github/scripts/ensure-hidden-bites-client-infra.sh`
- Browser:
  - local backend: `http://localhost:8097`
  - local client: `http://localhost:8096`
  - desktop `1440x920`: 3 sections all measured `920px`, 500 score dots, 11 factor buttons, 6 keyword chips
  - mobile `390x844`: 3 sections all measured `844px`, no checked horizontal overflow in body/main/section/key grids
  - interaction verified: QnA toggle, Taste factor filter to 50 dots, dot selection updates `?place=...#report`, report title updates, keyword chip changes snippets
  - Browser screenshot capture timed out in the Codex in-app browser, so verification used DOM snapshots and layout metrics.

## Deploy State

- Project-local `.codex/config.toml` already defines `aws_api`, but the current Codex tool session did not expose AWS MCP callables.
- Homebrew `aws` CLI is available and authenticated to AWS account `889566267001`.
- Read-only AWS checks on 2026-05-30:
  - before provisioning, `hidden-bites.leed.at` CloudFront distribution was not found.
  - before provisioning, ECR repository `hidden-bites-server` was not found.
  - before provisioning, S3 bucket `hidden-bites-production` was not found or not accessible.
- Local Docker CLI is not installed in the current shell.
- Biblabely server SSH config exists in `NLP-Biblabely/.codex/config.toml`, but `SSH_CERTIFICATE_PASSWORD` is not present in this shell.
- Therefore actual ECR image push and SSH container restart were not executed locally. The added GitHub Actions workflows perform those steps once required secrets are present.

## 2026-05-30 CloudFront Provisioning

- AWS profile: default credentials for account `889566267001`
- AWS MCP note: project-local `aws_api` MCP config exists, but this Codex session did not expose AWS MCP callables, so provisioning was executed with the default AWS CLI credentials.
- ACM certificate:
  - region: `us-east-1`
  - ARN: `arn:aws:acm:us-east-1:889566267001:certificate/b8dcd891-0598-49d6-b04e-0d7b25ff9cd6`
  - domains: `leed.at`, `*.leed.at`
  - status: `ISSUED`
- S3:
  - bucket: `hidden-bites-production`
  - prefix: `client-build`
  - server-side encryption: `AES256`
  - public access block enabled
  - bucket policy allows only CloudFront distribution `E1NJZVQR76TW2Z` to read objects.
- CloudFront function:
  - name: `HiddenBites-Routing`
  - live ARN: `arn:aws:cloudfront::889566267001:function/HiddenBites-Routing`
- CloudFront OAC:
  - name: `HiddenBites-S3-OAC`
  - id: `E2U7Z9DY0G4IWQ`
- CloudFront distribution:
  - id: `E1NJZVQR76TW2Z`
  - domain: `d154z9o0s3agqw.cloudfront.net`
  - alias configured: `hidden-bites.leed.at`
  - status after wait: `Deployed`
  - default origin: `hidden-bites-production.s3.ap-northeast-2.amazonaws.com`
  - backend origin: `115.68.177.250.sslip.io` on HTTP port `8097`
  - default behavior rewrites static app routes through `HiddenBites-Routing`
  - ordered behaviors: `/api/*`, `/health` to backend origin with caching disabled and all viewer headers except Host forwarded.
- Invalidation:
  - id: `IVYCG70UUNFB684RLAOWMIH6T`
  - status: `Completed`
- GitHub Actions:
  - repository secret `CLOUDFRONT_DISTRIBUTION_ID` was set to `E1NJZVQR76TW2Z` with `gh secret set`.
- Verification:
  - `https://d154z9o0s3agqw.cloudfront.net/` returned `HTTP/2 200`.
  - `https://d154z9o0s3agqw.cloudfront.net/_next/static/chunks/057hb_t5k9.-s.css` returned `HTTP/2 200`.
  - `https://d154z9o0s3agqw.cloudfront.net/api/summary` timed out because the backend container has not been deployed to `8097` yet.
  - `hidden-bites.leed.at` does not resolve yet from local DNS. This AWS account has no `leed.at` Route53 hosted zone; only `flit.lt.` was listed. DNS must be configured outside this account, or in the authoritative hosted zone, to alias `hidden-bites.leed.at` to `d154z9o0s3agqw.cloudfront.net`.

## 2026-05-30 Server Image Build CI Repair

- Failed run: GitHub Actions `Release Deploy` run `26680007972`, job `78638681087`.
- Failure point: `build_server / build_server` passed the package-manager-based server checks, then failed in Docker Buildx at `Build and push server image`.
- Historical root cause: `server/Dockerfile` installed dependencies with the npm lockfile path while the image build stage ran `yarn build`.
- Historical fix at the time: the Docker build command was aligned with the package manager then declared by the repo.
- Superseded by 2026-06-03 Yarn Package Manager 전환 below.

## 2026-06-03 Yarn Package Manager 전환

- `client/package.json`과 `server/package.json`의 `packageManager`를 `yarn@1.22.22`로 변경했다.
- `client/package-lock.json`과 `server/package-lock.json`을 제거하고 각각 `yarn.lock`을 생성했다.
- GitHub Actions reusable build jobs는 `actions/setup-node` cache를 `yarn`으로 바꾸고, `yarn install --frozen-lockfile`, `yarn typecheck`, `yarn lint`, `yarn test`, `yarn build:web`, `yarn type-check`, `yarn build`를 사용하도록 변경했다.
- `server/Dockerfile`은 `server/yarn.lock`을 복사하고 `corepack enable && yarn install --frozen-lockfile`, `corepack enable && yarn build`, production runner의 `yarn install --frozen-lockfile --production=true && yarn cache clean` 경로로 변경했다.
- `.github/scripts/validate-release-deploy-workflow.sh`는 `client/yarn.lock`, `server/yarn.lock`, `packageManager: yarn@1.22.22`, `RUN corepack enable && yarn build`, Dockerfile 내 `RUN npm` 미사용을 검증한다.
- 기존 npm lockfile 기반 문구는 historical note로만 남아 있으며, 현재 실행 기준은 Yarn이다.
- `client`와 `server` 디렉터리에서 사용자가 실행하는 `yarn` 명령은 `Already up-to-date`로 통과한다.

## 2026-06-03 Local API Proxy Repair

- 확인 결과 local `8086`에는 listener가 없고, Hidden Bites client는 `8096`, server는 `8097`에서 실행된다.
- 문제 원인: client는 `NEXT_PUBLIC_API_BASE_URL`이 비어 있으면 same-origin `/api/*`를 호출하지만, `client/next.config.ts`에는 dev server가 `/api/*`와 `/health`를 backend로 넘기는 rewrite가 없었다. 그래서 `8096/api/summary`는 Next trailing slash redirect 이후 404가 났고, `8097/api/summary`는 정상 200을 반환했다.
- `client/next.config.ts`에 development 모드 한정 rewrite를 추가해 `/api/:path*`를 `http://127.0.0.1:8097/api/:path*`, `/health`를 `http://127.0.0.1:8097/health`로 proxy한다.
- local backend port가 달라지는 경우 `HIDDEN_BITES_API_PROXY_TARGET`으로 target origin을 바꿀 수 있다.
- static export production build는 CloudFront `/api/*`, `/health` behavior가 담당하므로 production config에는 rewrite를 넣지 않는다.
- Regression guard: `client/test/dev-proxy-config.test.mjs`가 dev-only proxy, default backend target, trailing slash redirect skip, `/api`와 `/health` rewrite를 검증한다.

## 2026-06-03 HB Scores Node-to-Report Scroll

- `client/components/ScorePlot.tsx`의 scatter graph node, keyboard node selection, ranked list row, `Go to Report` 버튼이 selected restaurant를 고른 뒤 report section으로 이동하도록 `scrollToReport` 선택 옵션을 보낸다.
- `Go to Report` 버튼은 전용 `handleGoToReportClick` 핸들러를 통해 현재 selected score를 report selection으로 넘기고, selected score가 없으면 disabled 상태가 된다.
- `client/components/HiddenBitesExperience.tsx`는 selected restaurant query param과 `#report` hash를 유지한 다음, HB Scores에서 온 선택에 한해 `scrollIntoView({ behavior: "smooth", block: "start" })`로 다음 section에 slide down한다.
- Report section 내부 selector와 Seoul map selection은 기존 selected restaurant state/query 갱신 흐름을 유지하고, HB Scores node click만 다음 section 이동 UX를 명시한다.
- `.app-shell`의 desktop `max-width` 제한을 제거해 Figma story page가 viewport 전체 폭을 사용한다.
- Regression guard: `client/test/score-plot-report-scroll.test.mjs`가 score graph node click, keyboard selection, `Go to Report` button click, smooth report scroll contract, app shell full-width contract를 검증한다.

## 2026-06-03 Selected Report Restaurant Dropdown

- Figma report section의 `Selected:` restaurant name surface를 plain text가 아니라 restaurant dropdown으로 맞췄다.
- `client/components/HiddenBitesExperience.tsx`의 selected heading은 `selected-report-restaurant-select` select를 렌더링하고, 50개 restaurant option을 기존 selected restaurant state와 query sync handler로 연결한다.
- dropdown은 `restaurant-select` 공통 스타일을 재사용하고, `selected-heading__select`로 report heading용 poster-scale visual만 덮어쓴다.
- Regression guard: `client/test/client-contract.test.mjs`가 selected report heading dropdown, option 렌더링, plain text restaurant span 제거, CSS selector contract를 검증한다.

## 2026-06-03 WAGURI Korean Font

- Figma의 한글 display font에 맞춰 `client/app/globals.css`에 WAGURI webfont를 추가했다.
- WAGURI는 `https://cdn.jsdelivr.net/gh/projectnoonnu/2403@1.0/WAGURITTF.woff2`를 로드하고, `unicode-range`를 Hangul 범위로 제한해 한글 glyph만 WAGURI를 우선 사용한다.
- `--font-primary`는 `"WAGURI", "Airbnb Cereal", ...` 순서로 바꿔 한글은 WAGURI, 영문/숫자는 기존 Airbnb Cereal 경로를 유지한다.
- `client/app/layout.tsx`에 `https://cdn.jsdelivr.net` preconnect를 추가했다.
- CDN font HEAD check에서 `HTTP/2 200`, `content-type: font/woff2`, `access-control-allow-origin: *`, `cache-control: public, max-age=31536000`을 확인했다.
- Regression guard: `client/test/client-contract.test.mjs`가 WAGURI font-face, woff2 URL, Hangul unicode range, primary font stack, jsDelivr preconnect를 검증한다.

## 2026-06-03 Korean Restaurant Display Names

- 원본 Google Places 식당명은 `placeName`으로 보존하고, 웹 노출용 짧은 한글 식당명은 `displayPlaceName`으로 추가했다.
- `scripts/restaurant_display_names.mjs`가 `placeId` 기반 alias와 fallback 정규화 규칙을 관리한다. fallback은 구분자 `|`, `/`, `ㅣ`, 영문, 일본어, 중국어, 비한글 괄호 설명을 제거한 한글 후보를 고른다.
- `scripts/build_hb_score_web_report.mjs`는 `restaurants`, `points`, `reports`에 `displayPlaceName`을 생성하고, `scripts/sync_top_restaurant_display_names.mjs`는 standalone `/map`용 `client/data/top-restaurants-locations.json`에 `display_name`을 동기화한다.
- Client UI는 score dot aria-label, tooltip, ranked list, top pick, selected evaluation, report title, report dropdown, Google Maps link aria-label, Kakao map marker aria-label, Kakao map popup에서 `displayPlaceName`을 사용한다.
- Regression guard: `scripts/validate_hb_score_web_report.mjs`가 all restaurant/point/report display names의 한글 포함과 외국어 문자 미포함을 검증하고, client/server tests가 API와 UI 표시명 계약을 고정한다.
- Verification: `node scripts/validate_hb_score_web_report.mjs`, client `yarn typecheck && yarn lint && yarn test && yarn build:web`, server `yarn type-check && yarn lint && yarn test && yarn build`가 통과했고, Browser에서 `http://localhost:8096/?place=ChIJlQqAYNelfDURg2zfveD4eW4#scores` 렌더링 본문과 score/report label에 긴 원문 이름이 남지 않는 것을 확인했다.

## 2026-05-30 Client Airbnb Cereal Font

- Client global typography now uses `Airbnb Cereal` as the first font family through `client/app/globals.css`.
- The font-face declarations rely on locally installed Airbnb Cereal names and keep the existing system sans-serif fallback stack because this repository does not include proprietary Cereal font files.
- Previous Georgia and Courier-specific UI overrides were removed so hero titles, QnA labels, score axis labels, report numerals, emotion labels, and snippet metadata inherit the same Cereal-first family.
- Regression guard: `client/test/client-contract.test.mjs` asserts the Cereal font token is present and the removed Georgia/Courier declarations do not return.

## 2026-05-30 Advisor Professor Update

- Hidden Bites summary advisor 표기를 `Prof. Jee Won Kim`으로 변경했다.
- `scripts/build_hb_score_web_report.mjs`의 canonical summary 값을 수정하고 `datasets/derived/hb-score-web-report.json`을 재생성했다.
- `README.md`와 Figma wireframe 문서의 advisor metadata도 같은 값으로 맞췄다.
- 회귀 테스트 `server/test/hb-data.service.test.mjs`에서 API summary advisor 값이 `Prof. Jee Won Kim`인지 검증한다.

## 2026-05-30 HB Scores single-factor rank axis

- `client/components/ScorePlot.tsx`에서 HB Scores 그래프를 단일 factor 선택 구조로 변경했다.
- factor 선택은 x-axis 오른쪽 끝의 native dropdown select로만 수행한다.
- 기존 `All`/factor chip filter는 제거했고, 선택된 factor의 50개 restaurant point만 렌더링한다.
- 선택 factor 안에서 `hbScore` 내림차순으로 정렬한 뒤 x-axis를 restaurant count만큼 균등 분할해 배치한다.
- 높은 score restaurant는 left/top에, 낮은 score restaurant는 right/bottom에 오도록 `x=rank slot`, `y=hbScore` 구조를 사용한다.
- 회귀 테스트 `client/test/score-plot-axis.test.mjs`를 추가해 dropdown factor 선택, HB score descending sort, rank x-axis scale, 기존 factor filter 제거를 고정했다.

## 2026-05-30 Loading copy removal

- 초기 data load fallback에서 `Loading Hidden Bites data story` 문구를 제거하고 spinner만 남겼다.
- `client/test/client-contract.test.mjs`에 해당 loading copy가 재도입되지 않도록 회귀 검증을 추가했다.

## 2026-05-30 Seoul map graph section

- Hero의 `google top 50 restaurants in seoul` PNG preview를 제거하고 tracked asset `client/public/assets/seoul-top-restaurants.png`도 삭제했다.
- `scripts/build_hb_score_web_report.mjs`가 `datasets/google-places-seoul-top-restaurants-2026-05-15-locations.json` 좌표 캐시를 canonical web report payload에 병합한다.
- `RestaurantSummary`와 `RestaurantReport`에 `latitude`, `longitude`, `district`를 추가했고 summary metadata에 `mapPointCount`를 추가했다.
- Page3가 `Seoul Distribution` graph section이 되도록 `client/components/SeoulRestaurantMap.tsx`를 추가했다.
- 지도는 이미지가 아니라 SVG로 서울 외곽선, 한강 polyline, Google Top 50 restaurant dot distribution, district count bars를 직접 렌더링한다.
- Report section은 page4로 유지되고, 지도 dot 선택 시 기존 selected restaurant report state와 query param을 갱신한다.
- 회귀 테스트가 직접 이미지 재도입, 좌표 payload 누락, 지도 그래프 surface 누락을 검증한다.

## 2026-05-30 Client Airbnb Cereal CDN

- `client/app/globals.css`의 `Airbnb Cereal` font-face가 Airbnb `a0.muscache.com` CDN의 Cereal VF woff2 파일을 우선 로드한다.
- normal/italic variable font URL을 각각 등록했고, 기존 local font fallback과 system sans-serif fallback은 유지했다.
- `client/app/layout.tsx`에 `https://a0.muscache.com` preconnect를 추가했다.
- CDN font HEAD check에서 `HTTP/2 200`, `content-type: font/woff2`, `access-control-allow-origin: *`, `cache-control: public, max-age=31536000`을 확인했다.
- 회귀 테스트 `client/test/client-contract.test.mjs`가 CDN URL과 preconnect가 유지되는지 검증한다.

## 2026-11-06 Backend 제거, 정적 JSON 전환

- 배경: NestJS server는 `datasets/derived/hb-score-web-report.json`을 메모리에 올려 `summary`, `hb-scores`, `restaurants`, `reports[placeId]`로 잘라 GET 응답만 했다. 인증, DB, secret, 쓰기, 요청 시점 계산이 없어 정적 파일로 완전히 대체 가능했다.
- `client/scripts/export-static-data.mjs`:
  - canonical `datasets/derived/hb-score-web-report.json`을 읽어 `client/public/data/`에 `summary.json`(server와 같은 metadata subset), `hb-scores.json`, `restaurants.json`, `reports/<placeId>.json` 50개를 쓴다.
  - placeId가 `^[A-Za-z0-9_-]+$`인지, 중복이 없는지, 모든 restaurant에 report가 있는지 검증하고 실패 시 build를 중단한다.
  - 출력 디렉터리는 `.gitignore` 처리된 build artifact이며 매번 지우고 다시 만든다.
- `client/package.json`: `data:export` 추가, `dev`/`build`/`build:web`이 먼저 `yarn data:export`를 실행한다.
- `client/lib/api.ts`: `/data/*.json`을 fetch한다. 함수 이름과 반환 타입은 그대로라 컴포넌트 변경 없음. `NEXT_PUBLIC_API_BASE_URL` 제거.
- `client/next.config.ts`: dev `/api`, `/health` proxy rewrite와 `HIDDEN_BITES_API_PROXY_TARGET` 제거.
- 삭제: `server/`, `infra/nginx/hidden-bites.conf`, root `.dockerignore`, `.github/workflows/build-server.yml`, `deploy.yml`의 `deploy_backend` job, `release-deploy.yml`의 server filter/build job.
- CI: `build-client.yml`은 non-cone sparse checkout으로 `/client/`, `/.github/cloudfront/`, `/datasets/derived/hb-score-web-report.json`을 받는다. release client filter에 `datasets/derived/hb-score-web-report.json`을 추가했다.
- CloudFront function: `/api/*`, `/health` passthrough 제거. `/data/*.json`은 확장자가 있으므로 `/client-build/data/*.json`으로 rewrite된다. S3 sync 기본 cache-control(`max-age=300,must-revalidate`)이 적용된다.
- Regression guard:
  - `client/test/static-data-export.test.mjs`: export 결과가 canonical payload와 일치하는지, 모든 restaurant report 파일이 존재하는지, client가 `/api`·proxy를 쓰지 않는지 검증.
  - `.github/cloudfront/viewer-request.test.js`: `/data/...` rewrite 검증.
  - `.github/scripts/validate-release-deploy-workflow.sh`: server/build-server 부재, export script, sparse checkout dataset 포함 검증.
- Verification: client `yarn typecheck`, `yarn lint`, `yarn test`(23 pass), `yarn build:web` 통과. `serve client-build`(8096)에서 초기 로드 시 `/data/summary.json`, `/data/restaurants.json`, `/data/hb-scores.json`, 선택 report만 요청하고 `/api` 요청 없음, score dot 클릭 시 다른 `/data/reports/<placeId>.json`이 로드되어 report 갱신 확인.
- 배포: PR dongzoolee/hidden-bites#1 squash merge(`e69ceee`) 후 `release`로 push, Release Deploy run `42056339514` 성공(`changes`, `build_client`, `deploy_client`).
- 라이브 확인: `https://hidden-bites.leed.at/data/{summary,restaurants,hb-scores}.json`과 `/data/reports/<placeId>.json`이 `200 application/json`, 배포된 JS bundle에 `summary.json`이 있고 `/api/summary` 참조 없음.

## 2026-11-06 CloudFront Backend Route 정리

- 새 client 배포·라이브 확인 후 CloudFront `E1NJZVQR76TW2Z`에서 ordered behavior `/api/*`, `/health`와 origin `hidden-bites-api`(`v92c_hiihciwhdi28.leed.at`, `3.36.140.235` = ssh config의 `relay`)를 제거했다. 이전 문서의 `115.68.177.250.sslip.io` origin은 그 사이 이 값으로 바뀌어 있었다.
- 남은 origin은 `hidden-bites-s3` 하나이며 default behavior가 그대로 사용한다.
- 변경 전 distribution config는 세션 scratchpad에 백업만 했고 저장소에는 넣지 않았다. 되돌릴 때는 `aws cloudfront get-distribution-config`로 현재 ETag를 받아 두 behavior와 origin을 다시 추가한다.
- 확인: `aws cloudfront wait distribution-deployed` 완료 후 `/`, `/data/summary.json` 200, `/api/summary`와 `/health`는 CloudFront function의 SPA fallback으로 client `index.html`을 반환해 backend에 더 이상 도달하지 않는다.
- ECR repository `hidden-bites-server`(image 3개)는 사용자가 2026-11-06에 `aws ecr delete-repository --force`로 직접 삭제했다.
- 실제 backend 위치: CloudFront origin `v92c_hiihciwhdi28.leed.at` → `relay`(`3.36.140.235`) nginx stream `proxy_pass 10.77.0.2:443` → `mini`(`10.77.0.2`, ssh `ProxyJump relay`) nginx `/etc/nginx/conf.d/hidden-bites.conf` → `127.0.0.1:8097` container. 이전 문서의 `bible`(`115.68.177.250`)은 현재 경로가 아니다.
- `mini` 정리(2026-11-06):
  - container `hidden-bites-server`(image `hidden-bites-server:1334aeb…`) `docker rm -f`, 해당 image 삭제, 비어 있던 `hidden_bites_network` 삭제. 이후 `8097` listener 없음.
  - `/etc/nginx/conf.d/hidden-bites.conf`는 삭제하지 않고 `/etc/nginx/hidden-bites.conf.removed-20261106`으로 옮겼다(conf.d 밖이라 로드되지 않음). `nginx -t` 통과 후 reload, 같은 nginx의 biblabely/tab-monitor/teacher-bo 설정은 그대로이며 nginx `active`.
  - `relay`의 stream forward(`10.77.0.2:22`, `:443`)는 다른 서비스도 쓰므로 건드리지 않았다.
- 주의: `bible`(`115.68.177.250`)은 SSH 접속 시 `REMOTE HOST IDENTIFICATION HAS CHANGED` 경고가 나서 명령을 실행하지 않았다. hidden-bites와는 무관하지만 host key 변경 원인 확인이 필요하다.
- GitHub secret `SERVER_HOST`, `SERVER_USERNAME`, `SERVER_PASSWORD`, `SSH_PRIVATE_KEY`는 더 이상 이 저장소 workflow에서 쓰지 않는다.
