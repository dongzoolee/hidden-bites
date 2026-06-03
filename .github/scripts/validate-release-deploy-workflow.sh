#!/usr/bin/env sh
set -eu

test -f .github/workflows/build-client.yml
test -f .github/workflows/build-server.yml
test -f .github/workflows/deploy.yml
test -f .github/workflows/release-deploy.yml
test -f .github/cloudfront/viewer-request.js
test -f .github/cloudfront/viewer-request.test.js
test -f .github/scripts/ensure-hidden-bites-client-infra.sh
test -f server/yarn.lock
test -f client/yarn.lock
grep -q '"packageManager": "yarn@1\.22\.22"' server/package.json
grep -q '"packageManager": "yarn@1\.22\.22"' client/package.json
grep -qx 'RUN corepack enable && yarn build' server/Dockerfile
! grep -Eq 'RUN npm( |$)' server/Dockerfile
node .github/cloudfront/viewer-request.test.js
echo "release deploy workflow validation passed"
