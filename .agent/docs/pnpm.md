# 패키지 매니저: pnpm 10 (hoisted)

2026-11-26 `client/`를 yarn 1.22.22에서 pnpm 10.34.9로 옮겼다. 체크아웃·워크트리마다 `node_modules` 실복사본이 생겨 디스크를 먹던 문제를 없애려는 것이다. admob-widget `5da9969`·`3187b5a`와 같은 설정이다. 저장소에 JS 패키지는 `client/` 하나다(`server/`는 2026-11-06에 지웠다).

## 설정
- `client/package.json` `packageManager`: `pnpm@10.34.9+sha512.…`(corepack이 이 버전을 쓴다)
- `client/pnpm-workspace.yaml`
  - `nodeLinker: hoisted`: yarn v1과 같은 평평한 `node_modules`.
  - `autoInstallPeers: false`: yarn v1처럼 peer를 자동 설치하지 않아 의존 트리가 바뀌지 않는다.
  - `packageImportMethod: clone-or-copy`: macOS APFS에서 스토어(`~/Library/pnpm/store`)의 파일을 clonefile로 가져온다. 워크트리끼리 디스크 블록을 공유한다.
  - `ignoredBuiltDependencies`: 설치 스크립트를 돌리지 않을 패키지(아래 "빌드 스크립트").
- lock: `client/pnpm-lock.yaml`. `pnpm import`로 기존 `yarn.lock`에서 만들었다(버전 그대로). `yarn.lock`은 지웠다.
- 스크립트: `dev`·`build`·`build:web`이 `pnpm data:export`를 먼저 돈다. `test/static-data-export.test.mjs`가 이 문자열을 확인한다.

## 명령 (`client/`에서)
| 예전 | 지금 |
|---|---|
| `yarn install --frozen-lockfile` | `pnpm install --frozen-lockfile` |
| `yarn add <pkg>` | `pnpm add <pkg>` (`-D`는 devDependencies) |
| `yarn typecheck` / `yarn lint` / `yarn test` / `yarn build:web` | `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build:web` |
| `yarn --cwd client <script>` | `pnpm -C client <script>` |

- 패키지를 추가·변경한 뒤에는 `client/pnpm-lock.yaml`을 함께 커밋한다. CI는 `--frozen-lockfile`이라 lock이 안 맞으면 실패한다.
- `pnpm` 명령이 없거나 "configured to use yarn"이 나오면 `corepack enable`.

## 빌드 스크립트
pnpm 10은 허용 목록에 없는 의존성의 install 스크립트를 건너뛴다. 설치 출력에 "Ignored build scripts"가 나오면 실제로 필요한지 보고 `onlyBuiltDependencies`(필요) 또는 `ignoredBuiltDependencies`(불필요)에 넣는다.
- `sharp@0.34.5`(next의 optional 의존성): `ignoredBuiltDependencies`. 스크립트는 선빌드 `@img/sharp-*`가 없을 때 소스 빌드하는 용도이고, `output: "export"` 정적 빌드는 이미지 최적화를 쓰지 않는다.

## CI
`.github/workflows/build-client.yml`(release 브랜치 push·workflow_dispatch 때 `release-deploy.yml`이 호출): `actions/setup-node@v4`(node 24.14.0, 캐시 없음) → `corepack enable` + `$GITHUB_ENV`에 `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` → `actions/setup-node@v4`(`cache: pnpm`, `cache-dependency-path: client/pnpm-lock.yaml`) → `pnpm install --frozen-lockfile` → `pnpm typecheck && pnpm lint && pnpm test` → `pnpm build:web`. `pnpm/action-setup`은 쓰지 않는다(the-vine 러너에서 `ERR_INVALID_ARG_TYPE`).
`.github/scripts/validate-release-deploy-workflow.sh`는 `client/pnpm-lock.yaml`·`client/pnpm-workspace.yaml` 존재, `client/yarn.lock` 부재, `packageManager: pnpm@10.34.9`, `pnpm data:export`, build-client의 `pnpm install --frozen-lockfile`·yarn 미사용을 검증한다.

## 검증 (2026-11-26)
- `pnpm import` → `pnpm install --frozen-lockfile`: 328개 패키지. 무시된 빌드 스크립트는 `sharp@0.34.5` 하나였고 `ignoredBuiltDependencies`에 넣었다.
- `node_modules`를 지우고 `pnpm install --frozen-lockfile --offline`: 9.8초. `node_modules` 겉보기 464MB, 스토어와 공유하지 않는 APFS 블록 0MB.
- `pnpm typecheck` 0, `pnpm lint` 0, `pnpm build:web` 성공(`/`, `/map` 정적 내보내기), `node --test test/static-data-export.test.mjs` 2개 통과.
- `sh .github/scripts/validate-release-deploy-workflow.sh` 통과.
- 실제 release 배포는 돌리지 않았다.
