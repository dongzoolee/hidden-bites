# Robots Txt

## 2026-06-13 Implementation

- Added `client/public/robots.txt` so the Next.js client serves `/robots.txt` as a static public asset.
- The robots policy welcomes all crawlers with `User-agent: *` and `Allow: /`.
- Added `client/test/robots-contract.test.mjs` to guard that the public file keeps the all-crawler allow policy and does not add a `Disallow` rule.

## Verification

- `yarn test` passed with 12 tests, including `public robots.txt welcomes search crawlers`.
- `yarn typecheck` passed.
- `yarn lint` passed.
- `yarn build:web` passed and copied `public/robots.txt` into `client-build/robots.txt`.
- `yarn start` served the static export on `http://localhost:60438` because `8096` was already in use; `curl -i http://localhost:60438/robots.txt` returned `HTTP/1.1 200 OK` with the expected file body.
