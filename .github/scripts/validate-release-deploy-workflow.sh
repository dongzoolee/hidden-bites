#!/usr/bin/env sh
set -eu

test -f .github/workflows/build-client.yml
test -f .github/workflows/deploy.yml
test -f .github/workflows/release-deploy.yml
test -f .github/cloudfront/viewer-request.js
test -f .github/cloudfront/viewer-request.test.js
test -f .github/scripts/ensure-hidden-bites-client-infra.sh
test -f client/yarn.lock
test -f client/scripts/export-static-data.mjs
test -f datasets/derived/hb-score-web-report.json
test ! -e server
test ! -e .github/workflows/build-server.yml
grep -q '"packageManager": "yarn@1\.22\.22"' client/package.json
grep -q '"data:export": "node scripts/export-static-data.mjs"' client/package.json
grep -q 'yarn data:export && next build && mv out client-build' client/package.json
grep -q '/datasets/derived/hb-score-web-report.json' .github/workflows/build-client.yml
! grep -Eq 'build_server|deploy_server|deploy_backend' .github/workflows/release-deploy.yml .github/workflows/deploy.yml
node .github/cloudfront/viewer-request.test.js
echo "release deploy workflow validation passed"
