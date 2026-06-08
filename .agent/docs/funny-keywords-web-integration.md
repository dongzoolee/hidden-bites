# Funny Keywords Web Integration

## Scope
- `RestaurantReportPanel`의 `The Unique & Fun Keywords` 영역을 기존 TF-IDF/raw keyword chip 대신 curated funny category 기반 UI로 교체했다.
- 기존 `keywords` payload는 호환성 때문에 유지하지만 클라이언트에서는 렌더링하지 않는다.
- 별도 endpoint 없이 기존 `/api/restaurants/:placeId/report` 응답에 `funnyKeywords`를 추가했다.

## Data Contract
- `funnyKeywords`는 restaurant report마다 12개 category를 항상 포함한다.
- 각 category 필드는 `id`, `label`, `color`, `terms`, `reviewCount`, `matchCount`, `snippets`이다.
- `snippets`는 기존 `ReviewSnippet` 필드에 `matchedTerms: string[]`를 추가한 구조다.
- 서버 타입은 `server/src/hb/hb.types.ts`, 클라이언트 타입은 `client/lib/api-types.ts`에 strict interface로 반영했다.

## Matching
- source taxonomy는 `/Users/dongzoolee/Downloads/Funny_Keywords.ipynb`의 12개 category와 term 목록을 canonical로 반영했다.
- 리뷰 본문은 whitespace normalize 후 15자 이상인 경우만 매칭 대상이다.
- Korean/English term 모두 `toLowerCase()` 기반 case-insensitive substring matching으로 판정한다.
- category별 snippets는 `matchedTerms.length desc`, `rating desc`, `original review index asc` 순으로 안정 정렬하고 최대 4개만 노출한다.
- report 진입 기본 선택값은 `reviewCount > 0`인 첫 category이며, 없으면 첫 category다.

## UI Behavior
- chip은 12개 category를 항상 보여주고 count badge를 함께 표시한다.
- active chip과 review card는 category color를 사용하며, 색상 밝기에 따라 readable text color를 계산한다.
- count가 0인 category를 선택하면 `해당 original review 없음` empty state를 보여준다.
- snippet footer는 `CATEGORY: {label} · MATCH: {matchedTerms}` 형식으로 original review와 matched expression을 연결한다.

## Verification
- `node scripts/build_hb_score_web_report.mjs`
- `node scripts/validate_hb_score_web_report.mjs`
- `yarn --cwd client typecheck`
- `yarn --cwd client test`
- `yarn --cwd client lint`
- `yarn --cwd server build`
- `yarn --cwd server lint`
- `yarn --cwd server test`
- Browser regression on Next dev:
  - desktop first report: 12 chips, default `🥨 Crunch Boss`, 4 snippets.
  - desktop `🕵️ Hidden Boss`: 2 snippets and category footer.
  - desktop empty category `🔥 Fire Bite`: 0 snippets and empty state.
  - mobile 390x844: 12 chips, 4 snippets, no horizontal overflow.
