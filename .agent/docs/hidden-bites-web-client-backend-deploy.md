# Hidden Bites Web Client, Backend, Deploy

## 목적

Hidden Bites를 Next.js static export client와 NestJS read-only REST backend로 분리해 웹 배포 가능한 구조로 만들었다. Figma `g1aNjTsNQVz5KPEVqMC4qY`, node `192:45` wireframe을 MCP로 확인했고, 사용자가 확정한 3개 `100svh` 화면 구조에 맞춰 hero/QnA, HB Scores, selected restaurant report를 한 페이지 scroll-snap UI로 구현했다.

## Client

- 경로: `client/`
- Stack: Next.js App Router, React 19, TypeScript strict, ESLint flat config, npm lockfile
- Static export output: `client/client-build`
- API base:
  - production: same-origin `/api`
  - local verification: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8097`
- UI:
  - `intro`: Hidden Bites title, class/meta, description, Seoul top restaurant map preview, QnA accordion
  - `scores`: 10 factor filters, 500-dot HB score scatter plot, selected restaurant query param sync
  - `report`: selected restaurant summary, factor bars, adjective/emotion stack, keyword chips, review snippets
- Layout:
  - desktop/mobile section height is fixed at `100svh`
  - mobile sections use internal vertical scroll when needed
  - score chart uses horizontal overflow only inside the chart on narrow screens

## Backend

- 경로: `server/`
- Stack: NestJS REST API, TypeScript strict, ESLint flat config, npm lockfile
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
  - `npm run type-check`
  - `npm run lint`
  - `npm run test`
  - `npm run build`
  - 테스트 4개 통과: health, summary/scores/restaurants/report success, missing report 404
- Client:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test`
  - `npm run build:web`
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
- Failure point: `build_server / build_server` passed the npm-based server checks, then failed in Docker Buildx at `Build and push server image`.
- Root cause: `server/Dockerfile` installed dependencies with `npm ci` from `server/package-lock.json`, but the image build stage ran `yarn build`. This repo declares `npm@11.6.2` in both client and server package metadata and does not use a Yarn lockfile.
- Fix: `server/Dockerfile` now runs `npm run build` in the build stage.
- Regression guard: `.github/scripts/validate-release-deploy-workflow.sh` now asserts that both package manifests use npm, the server Dockerfile contains `RUN npm run build`, and no `RUN yarn` command remains.
- Local validation note: the current Codex shell has no system `npm`, `yarn`, `gh`, or `docker` commands. TypeScript build/type-check were verified directly through installed `server/node_modules` with the bundled Codex Node runtime; Docker image execution could not be reproduced locally in this shell.

## 2026-05-30 Client Airbnb Cereal Font

- Client global typography now uses `Airbnb Cereal` as the first font family through `client/app/globals.css`.
- The font-face declarations rely on locally installed Airbnb Cereal names and keep the existing system sans-serif fallback stack because this repository does not include proprietary Cereal font files.
- Previous Georgia and Courier-specific UI overrides were removed so hero titles, QnA labels, score axis labels, report numerals, emotion labels, and snippet metadata inherit the same Cereal-first family.
- Regression guard: `client/test/client-contract.test.mjs` asserts the Cereal font token is present and the removed Georgia/Courier declarations do not return.
