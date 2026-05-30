#!/usr/bin/env sh
set -eu

test -f .github/workflows/build-client.yml
test -f .github/workflows/build-server.yml
test -f .github/workflows/deploy.yml
test -f .github/workflows/release-deploy.yml
test -f .github/cloudfront/viewer-request.js
test -f .github/cloudfront/viewer-request.test.js
test -f .github/scripts/ensure-hidden-bites-client-infra.sh
node .github/cloudfront/viewer-request.test.js
echo "release deploy workflow validation passed"
