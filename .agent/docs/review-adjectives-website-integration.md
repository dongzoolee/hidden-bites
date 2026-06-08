# Review Adjectives Website Integration

## 산출물

- 최종 source artifact: `datasets/derived/review-adjectives.json`
- 원본 입력: `/Users/dongzoolee/Downloads/adj_counts (2).json`
- 웹 report payload: `datasets/derived/hb-score-web-report.json`
- 빌드 스크립트: `scripts/build_hb_score_web_report.mjs`

## 구현 내용

- Python 재추출 pipeline 없이 최종 adjective 집계 JSON을 그대로 repo derived dataset으로 편입했다.
- `review-adjectives.json`의 `category_draft`, `global_top100`, `per_restaurant`, `metadata` 구조는 보존했다.
- `scripts/build_hb_score_web_report.mjs`는 `place_rank` 기준으로 HB score restaurant과 adjective profile을 join한다.
- 각 restaurant report는 기존 `emotionBuckets` 대신 `adjectiveBuckets`를 포함한다.
- `adjectiveBuckets`는 4개 category를 고정으로 제공한다.
  - `everyday-calm`: `🌱 평온/일상`
  - `positive-gentle`: `✨ 긍정/온화`
  - `intense-overwhelming`: `🔥 강렬/압도`
  - `negative-discomfort`: `😤 부정/불편`
- 각 bucket은 `count`, `share`, `averageShare`, `topAdjectives`를 가진다.
- `share`는 해당 식당 `top30_adjs` 필드에 담긴 top adjective count 전체 대비 category count 비율이다.
- `averageShare`는 동일한 기준으로 계산한 all-50 평균 share다.
- `RestaurantReportPanel`의 graph diamond marker는 이제 해당 bucket의 `averageShare`를 사용한다.
- 하단 `The Unique & Fun Keywords`는 기존 raw `report.keywords` chip과 original review snippet filtering을 유지한다.

## 검증 기준

- `scripts/validate_hb_score_web_report.mjs`는 다음 계약을 검증한다.
  - score restaurant 50개와 adjective profile 50개 rank가 일치한다.
  - adjective category는 4개다.
  - 모든 restaurant profile에 최소 1개 mapped adjective가 있다.
  - 모든 report에 `adjectiveBuckets.length === 4`가 있다.
  - `emotionBuckets`는 report payload에 남지 않는다.
- server test는 selected report API가 4개 adjective bucket을 반환하는지 확인한다.
- client test는 4개 adjective graph, all-50 average marker, top adjective label, 기존 keyword chip/snippet footer 계약을 확인한다.

## 실행한 검증

- `node scripts/build_hb_score_web_report.mjs && node scripts/validate_hb_score_web_report.mjs`
- `cd server && yarn test && yarn type-check && yarn lint`
- `cd client && yarn test && yarn typecheck && yarn lint && yarn build`
- Browser viewport 검증:
  - desktop `1440x1100`: 4개 adjective chip, 4개 graph column, 6개 keyword chip, snippet 4개, body overflow 없음
  - mobile `390x844`: 4개 adjective chip, 4개 graph column, 6개 keyword chip, snippet 4개, body overflow 없음
  - 남은 콘솔 에러는 `favicon.ico` 404 1건뿐이다.

## 참고

- `top30_adjs` 필드명은 최종 JSON에 그대로 남아 있지만 실제 데이터는 식당별 top10 adjective로 취급한다.
- GraphQL, Prisma, client codegen 변경은 없다.
