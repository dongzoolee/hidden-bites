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
  - `hidden-bites.leed.at` CloudFront distribution was not found.
  - ECR repository `hidden-bites-server` was not found.
  - S3 bucket `hidden-bites-production` was not found or not accessible.
- Local Docker CLI is not installed in the current shell.
- Biblabely server SSH config exists in `NLP-Biblabely/.codex/config.toml`, but `SSH_CERTIFICATE_PASSWORD` is not present in this shell.
- Therefore actual ECR image push, S3 sync, CloudFront invalidation, and SSH container restart were not executed locally. The added GitHub Actions workflows perform those steps once required secrets and CloudFront distribution are present.
