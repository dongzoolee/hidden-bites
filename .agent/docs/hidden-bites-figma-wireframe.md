# Hidden Bites Figma Web Desktop Wireframe

## 목적

Hidden Bites 프로젝트의 web-desktop wireframe을 Figma MCP로 생성했다. 결과물은 기존 Figma `Projects` 파일의 `Hidden Bites` 페이지에 배치했다.

## Figma 산출물

- Figma file: `Projects`
- File key: `mWQ4NQfSZyLOJD94bLdgwD`
- Page: `Hidden Bites`
- Frame: `Hidden Bites / Web Desktop Wireframe`
- Frame node: `7829:1297`
- URL: `https://www.figma.com/design/mWQ4NQfSZyLOJD94bLdgwD/Projects?node-id=7829-1297`
- Size: `1440 x 7480`

## Prompt / Spec

Style direction은 The Pudding 계열의 editorial data story로 잡았다. 배경은 off-white paper tone, 타이포그래피는 강한 display title, 주석은 hand-drawn annotation처럼 보이게 구성했다. 데이터 UI는 compact control, playful chart mark, scrollytelling rhythm을 기준으로 만들었다.

- Title: `Hidden Bites`
- Class: `26-1 Data Visualization @ Sogang A&T`
- Advisor: `Prof. Jee Won Kim`
- Members: `dongzoolee`, `Eunhong`, `Madina`, `Emilia`
- Description: Google top 50 restaurants in Seoul, selected by top star points and most reviews
- Main question: What are the factors for Matjip in Seoul?

## 구현 섹션

1. `Hero / Meta`
   - 프로젝트 제목, 수업 정보, advisor, members, 핵심 질문, 스케치 기반 주석, mini top-50 chart를 배치했다.
2. `QnA Accordion`
   - `Why we chose GMap?`
   - `How we chose top 50 restaurants?`
   - SDS에서 accordion/select/slider component 존재를 확인했지만, 이번 산출물은 hand-sketched editorial wireframe 성격이 강해 primitive 기반 accordion row로 구성했다.
3. `HB Scores`
   - factor dropdown, six factor sliders, selected score result, emoji stack graph, scatter position을 포함했다.
   - Factors: `Taste`, `Service`, `Value`, `Atmosphere`, `Accessibility`, `Wait/Queue`.
4. `Selected Restaurant Report`
   - `The Review Adjectives`: extracted adjective emotion stack chart.
   - `The Unique Keywords`: Korean keyword chips and original review snippets.
5. `Where Are They Located`
   - simplified Seoul map과 top-50 dot clusters를 배치했다.
   - dataset 기반 district callout은 `중구 12`, `마포구 9`, `강남구 8`을 사용했다.
   - 분석 문구는 Hongdae, Euljiro/Myeongdong, Gangnam/COEX, Seongsu, Itaewon, Daehakro 같은 관광/상업/야간 활동 지역 밀집을 반영했다.
6. `Limitations`
   - Seoul 전체 식당 전수 조사 불가, Google Maps reviewer sampling bias, tourist-place review-volume bias, NLP extraction limitations, exploratory HB Score limitation을 포함했다.

## 검증

- `get_metadata`로 `Hidden Bites / Web Desktop Wireframe` frame과 주요 section node가 생성된 것을 확인했다.
- `get_screenshot`으로 nonblank 1440px desktop frame, hero, QnA, HB Scores, report, map, limitations가 한 프레임에 렌더링되는 것을 확인했다.
- 첫 스크린샷에서 일부 heading/body overlap과 rotated vertical-axis 렌더링 문제가 보여 Figma node 위치와 vertical axis shape을 재조정했다.
- 최종 스크린샷에서 주요 텍스트와 UI 요소가 섹션 단위로 읽히도록 정리됐다.

## Repo Check

- 이 저장소에는 `package.json`, `tsconfig.json`, eslint config가 없어 TypeScript/eslint 실행 대상이 없다.
- 이번 변경은 Figma 산출물과 문서 업데이트만 포함한다.
