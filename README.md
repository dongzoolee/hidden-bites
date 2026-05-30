# Hidden Bites: Decoding Seoul Restaurant Reviews

Hidden Bites is a data visualization final project that investigates restaurant discovery in Seoul through Naver Map review data. The project starts from a simple question:

> Are restaurants with many reviews really good restaurants?

Rather than treating review count or rating-like signals as direct proof of quality, this project focuses on the context inside review text: when people visit, whether they reserve, how long they wait, why they visit, who they visit with, and what evidence supports those extracted labels.

## Project Status

This repository currently contains the project goal, canonical review schema, pilot locations, collected Naver Map review dataset, and a lightweight notebook for checking review text. Processed datasets and visualizations will be added as the analysis progresses.

## Web Desktop Wireframe Prompt

The current Figma direction is a 1440px web-desktop editorial wireframe for the Hidden Bites page, inspired by The Pudding's data-story style: off-white paper tone, strong display typography, hand-drawn annotations, compact controls, playful chart marks, and scrollytelling section rhythm.

- Figma target: `Projects` file, `Hidden Bites` page
- Frame: `Hidden Bites / Web Desktop Wireframe`
- Title: `Hidden Bites`
- Class: `26-1 Data Visualization @ Sogang A&T`
- Advisor: `Prof. Jee Won Kim`
- Members: `dongzoolee`, `Eunhong`, `Madina`, `Emilia`
- Core description: Google top 50 restaurants in Seoul, selected by top star points and most reviews
- Main question: What are the factors for Matjip in Seoul?

The wireframe sections are:

1. QnA accordion
   - `Why we chose GMap?`: Naver Map has many advertising-like reviews and no star points, while Kakao Map has fewer reviews.
   - `How we chose top 50 restaurants?`: recent five-year Seoul review availability, high review volume, and high star points.
2. HB Scores
   - Recalculates star points into HB Score by matjip factor.
   - X-axis: factor.
   - Y-axis: HB Score from `0.00` to `5.00`.
   - Dots: restaurants.
   - Factors: `Taste`, `Service`, `Value`, `Atmosphere`, `Accessibility`, `Wait/Queue`, `Visit Occasion`, `Portion`, `Cleanliness`, `Signature/Uniqueness`.
   - The graph uses one restaurant dot per factor, so the current top-50 dataset produces 500 graph points.
3. Report for the selected restaurant
   - `The Review Adjectives`: macro emotional stack chart from extracted review adjectives.
   - `The Unique Keywords`: keyword chips and original review snippets containing the selected keyword.
4. Where are they located?
   - Seoul map dot distribution of the top-50 restaurants.
   - Current dataset-derived district callouts: `중구 12`, `마포구 9`, `강남구 8`.
   - Analysis: many top restaurants cluster around tourism, shopping, office, and nightlife areas such as Hongdae, Euljiro/Myeongdong, Gangnam/COEX, Seongsu, Itaewon, and Daehakro.
5. Limitations
   - We could not research all restaurants in Seoul.
   - Google Maps reviewers are not a neutral sample of all visitors.
   - Review volume favors tourist places and places that already get searched often.
   - NLP adjective and keyword extraction can miss slang, sarcasm, and multilingual reviews.
   - HB Score is exploratory, not a final quality ranking.

## Team

- Madina
- Kim Eunhong
- Emilia
- Dongjoo Lee

## Research Direction

The project explores criteria for identifying meaningful Seoul restaurant recommendations from review data. The main analysis question is:

> Can review text reveal restaurants that are genuinely useful or satisfying, beyond high review volume alone?

The working hypothesis is that a restaurant's perceived value depends on visit context, not only popularity. A place with many reviews may be popular because it is convenient, tourist-friendly, viral, or heavily exposed. A place with fewer reviews may still be valuable for specific contexts such as solo dining, low waiting time, family visits, daily meals, or reservation reliability.

## Data Source

The initial dataset was collected from Naver Map place pages.

- Source: Naver Map
- Collection scope: Seoul restaurants and cafes
- Pilot size: 10 locations
- Review limit: latest 500 reviews per location, or all available reviews when fewer than 500 exist
- Current dataset: `datasets/naver-map-reviews-2026-05-13.json`
- Current total: 4,091 reviews
- Sort order: latest
- Unit of storage: one JSON object per location

Google Places candidate collection is prepared as a low-budget companion data source for finding Seoul restaurants with rating 4.5+ and high review counts. See `.agent/docs/google-places-seoul-top-restaurants.md` for the request cap, cost guard, and execution command.

The raw review text must be preserved. Any derived labels must remain separate from the original text so that extraction rules or models can be reviewed and rerun later.

## Canonical Review Schema

Naver Map review data will be stored with the following structure:

```json
{
  "location": {
    "name": "청석골",
    "type": "restaurant",
    "naver_map_url": "...",
    "naver_place_id": "...",
    "address": "...",
    "category": "한식"
  },
  "collection": {
    "source": "naver_map",
    "sort": "latest",
    "limit": 500,
    "collected_at": "2026-05-13T09:30:00+09:00"
  },
  "reviews": [
    {
      "rank": 1,
      "source_review_id": null,
      "reviewed_at": null,
      "visited_date": null,
      "visit_time_label": "저녁에",
      "reserved": "unknown",
      "waiting": {
        "label": "바로 입장",
        "minutes_min": 0,
        "minutes_max": 0
      },
      "purpose": ["travel", "daily"],
      "companion": "alone",
      "text": "...",
      "naver_keywords": [],
      "extraction": {
        "confidence": 0.82,
        "evidence": {
          "waiting": "바로 들어갔어요",
          "companion": "혼밥하기 좋았어요"
        }
      }
    }
  ]
}
```

## Field Reference

### Location

- `location.name`: Place name displayed on Naver Map.
- `location.type`: Internal venue type. Expected values are `restaurant` and `cafe`.
- `location.naver_map_url`: Source Naver Map URL used for collection.
- `location.naver_place_id`: Naver place identifier when available; otherwise `null`.
- `location.address`: Address displayed on Naver Map when available.
- `location.category`: Original Naver category label, such as `한식` or `카페`.

### Collection

- `collection.source`: Fixed as `naver_map`.
- `collection.sort`: Review ordering used during collection. The current plan uses `latest`.
- `collection.limit`: Target number of reviews per location. The current pilot limit is up to `500`.
- `collection.collected_at`: ISO 8601 timestamp with timezone.

### Reviews

- `reviews[].rank`: Position in the collected latest-review order, starting from `1`.
- `reviews[].source_review_id`: Source review identifier if reliably available; otherwise `null`.
- `reviews[].reviewed_at`: Review creation date if available.
- `reviews[].visited_date`: Actual visit date if explicitly available.
- `reviews[].visit_time_label`: Visit timing label such as morning, lunch, evening, night, weekday, or weekend.
- `reviews[].reserved`: Reservation status. Expected values are `yes`, `no`, and `unknown`.
- `reviews[].waiting.label`: Original or normalized waiting-time expression.
- `reviews[].waiting.minutes_min`: Minimum estimated waiting time in minutes; `null` when unknown.
- `reviews[].waiting.minutes_max`: Maximum estimated waiting time in minutes; `null` when unknown.
- `reviews[].purpose`: Visualization-friendly English labels for visit purpose.
- `reviews[].companion`: Visualization-friendly English label for companion type.
- `reviews[].text`: Original review text. This field must always be preserved.
- `reviews[].naver_keywords`: Original Naver review keywords when available.
- `reviews[].extraction.confidence`: Confidence score for extracted labels, from `0` to `1`.
- `reviews[].extraction.evidence`: Original Korean text snippets that support extracted labels.

## Normalized Labels

### `purpose`

- `daily`: Casual or neighborhood visit.
- `travel`: Tourism, Seoul trip, or sightseeing context.
- `date`: Date or couple visit.
- `family`: Family gathering or family meal.
- `friends`: Visit with friends.
- `business`: Company dinner, business meal, meeting, or work context.
- `study`: Study, work session, or laptop-friendly visit.
- `special_day`: Birthday, anniversary, or other special occasion.
- `takeout`: Takeout or pickup.
- `unknown`: Purpose cannot be inferred.

### `companion`

- `alone`: Solo visit.
- `couple`: Couple or dating context.
- `family`: Family.
- `friends`: Friends.
- `coworkers`: Coworkers or company dinner.
- `group`: Group visit with unclear relationship.
- `unknown`: Companion type cannot be inferred.

## Pilot Locations

The first collection pass will use the following Naver Map short links:

1. https://naver.me/5V8Yn0C5
2. https://naver.me/xRhE3IiL
3. https://naver.me/xeAS2bgo
4. https://naver.me/FbOnl2vH
5. https://naver.me/5WOQsZDT
6. https://naver.me/F74VbHLY
7. https://naver.me/F5D16vXg
8. https://naver.me/5tJtUovR
9. https://naver.me/IgJGrzK4
10. https://naver.me/GbDFQCT2

## Planned Workflow

1. Formulate the visualization question and define the first dataset scope.
2. Collect Naver Map review data for the pilot locations.
3. Normalize location-level and review-level fields into the canonical schema.
4. Handle missing values by distinguishing unavailable source data from unknown inferred labels.
5. Adjust the research question to fit the final dataset size and label quality.
6. Start with conventional charts for exploration, such as review volume, waiting-time ranges, visit-purpose distribution, and companion distribution.
7. Develop an unconventional visualization that compares hidden visit contexts rather than only popularity.
8. Document the final visualization's bias, limitations, and unavoidable uncertainty.

## Planned Repository Structure

```text
.
|-- data/
|   |-- raw/
|   `-- processed/
|-- notebooks/
|-- src/
|   |-- collect/
|   |-- extract/
|   `-- visualize/
|-- .agent/
|   `-- docs/
`-- README.md
```

This structure is a planned layout. It should be updated once reusable collection scripts, processed datasets, and visualization artifacts are added.

## Analysis Ideas

- Compare review count against context signals such as low waiting time, solo-dining friendliness, and visit purpose.
- Identify restaurants that are useful for specific situations, not only those with the highest review volume.
- Separate popularity-driven places from contextually strong places by combining extracted labels with review text evidence.
- Visualize uncertainty by exposing extraction confidence and missing-data rates.

## Limitations

- The latest 500 reviews per location may overrepresent recent events, campaigns, seasonality, or temporary popularity.
- Naver Map reviews are not a neutral sample of all visitors.
- Fake review filtering cannot be fully guaranteed from text alone.
- Extracted labels such as purpose, companion, and waiting time are inferred from imperfect natural language.
- `extraction.confidence` is an analysis aid, not ground truth.
- Restaurants and cafes may require different interpretation because review behavior and visit purpose differ by venue type.

## Related Project Notes

- `.agent/docs/naver-map-review-schema.md` contains the Korean schema review and normalization rationale.
- Future implementation notes should be added under `.agent/docs` whenever the project structure, data contract, or analysis workflow changes.
