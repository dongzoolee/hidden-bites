# 네이버 지도 리뷰 수집 스키마 검토

## 목적

서울 시내 레스토랑과 카페 10곳의 네이버 지도 리뷰를 장소별 최신순 50개씩 수집하고, 리뷰 텍스트에서 방문 시간대, 예약 여부, 대기 시간, 방문 목적, 동행 형태를 구조화한다.

## 원안

```json
{
  "location_name": "청석골",
  "location_type": "cafe | restaurant",
  "reviews": [
    {
      "visited_at": "저녁에",
      "reserved": true,
      "waiting_time": "바로 입장",
      "purpose": ["여행", "일상"],
      "companion": "혼자",
      "text": "..."
    }
  ]
}
```

## 검토 결과

원안은 간단한 요약 결과로는 사용할 수 있지만, 리뷰 50개씩을 반복 수집하고 나중에 재검증하거나 재분류하기에는 부족하다.

특히 `visited_at`은 실제 방문 날짜와 방문 시간대가 섞일 수 있으므로 `visited_date`, `visit_time_label`, `reviewed_at`을 분리하는 것이 좋다. `reserved`, `waiting_time`, `purpose`, `companion`은 대부분 리뷰 문장으로부터 추론되는 값이기 때문에 추론 근거와 신뢰도를 함께 저장해야 한다.

## 권장 구조

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
    "limit": 50,
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

## 필드 기준

- `location`: 장소 단위 메타데이터를 담는다.
- `location.name`: 네이버 지도에 표시되는 장소명.
- `location.type`: 내부 분류값. `restaurant` 또는 `cafe`.
- `location.naver_map_url`: 사용자가 제공한 네이버 지도 링크.
- `location.naver_place_id`: 네이버 지도 URL 또는 페이지에서 확인 가능한 장소 식별자. 확인이 어려우면 `null`.
- `location.address`: 네이버 지도에 표시되는 주소. 확인이 어려우면 `null`.
- `location.category`: 네이버 지도 카테고리 원문. 예: `한식`, `카페`.
- `collection.source`: `naver_map`으로 고정한다.
- `collection.sort`: 최신순 수집이면 `latest`.
- `collection.limit`: 장소별 목표 리뷰 수. 현재 기준은 `50`.
- `collection.collected_at`: 수집 시점. ISO 8601 문자열을 사용한다.
- `reviews[].rank`: 최신순 정렬 기준에서의 순번. 1부터 시작한다.
- `reviews[].source_review_id`: 원천 리뷰 식별자. 네이버 지도에서 안정적으로 확인되지 않으면 `null`.
- `reviews[].reviewed_at`: 리뷰 작성일. 확인되지 않으면 `null`.
- `reviews[].visited_date`: 방문 날짜. 네이버가 방문일을 제공하거나 리뷰에서 명확히 추출될 때만 사용하고, 불명확하면 `null`.
- `reviews[].visit_time_label`: `아침`, `점심`, `저녁`, `밤`, `주말`, `평일` 등 방문 시간대 또는 시점 라벨.
- `reviews[].reserved`: 예약 여부. `yes`, `no`, `unknown` 중 하나를 사용한다.
- `reviews[].waiting.label`: 원문 또는 정규화된 대기 표현. 예: `바로 입장`, `10분 대기`, `웨이팅 김`.
- `reviews[].waiting.minutes_min`: 분 단위 최소 대기 시간. 확인 불가하면 `null`.
- `reviews[].waiting.minutes_max`: 분 단위 최대 대기 시간. 확인 불가하면 `null`.
- `reviews[].purpose`: 방문 목적 배열. 내부 정규화 값으로 저장한다.
- `reviews[].companion`: 동행 형태. 내부 정규화 값으로 저장한다.
- `reviews[].text`: 리뷰 원문. 반드시 보존한다.
- `reviews[].naver_keywords`: 네이버 지도 리뷰 키워드가 확인되면 원문 배열로 저장한다.
- `reviews[].extraction.confidence`: 추론 신뢰도. 0부터 1 사이 숫자를 사용한다.
- `reviews[].extraction.evidence`: 각 추론값의 근거가 된 원문 일부를 저장한다.

## 정규화 값

### location.type

- `restaurant`
- `cafe`

### reserved

- `yes`: 예약했다는 표현이 명확한 경우.
- `no`: 예약 없이 방문했다는 표현이 명확한 경우.
- `unknown`: 예약 여부를 판단할 수 없는 경우.

### purpose

- `daily`: 일상 방문, 동네 방문, 가볍게 들른 경우.
- `travel`: 여행, 서울 나들이, 관광 맥락.
- `date`: 데이트.
- `family`: 가족 모임.
- `friends`: 친구 모임.
- `business`: 회식, 미팅, 업무 맥락.
- `study`: 공부, 작업, 노트북 사용.
- `special_day`: 생일, 기념일 등 특별한 날.
- `takeout`: 포장, 테이크아웃.
- `unknown`: 목적 판단 불가.

### companion

- `alone`: 혼자 방문.
- `couple`: 연인 또는 데이트 맥락.
- `family`: 가족.
- `friends`: 친구.
- `coworkers`: 회사 동료 또는 회식.
- `group`: 구체 관계가 불분명한 단체.
- `unknown`: 동행 형태 판단 불가.

## 운영 원칙

원문 리뷰와 추론 결과를 분리해 저장한다. 추론값만 저장하면 나중에 모델이나 규칙이 바뀌었을 때 재처리와 검증이 어렵다.

최신순 50개라는 수집 조건은 리뷰 배열에만 암묵적으로 두지 말고 `collection.sort`, `collection.limit`, `reviews[].rank`로 명시한다.

`null`은 원천 데이터가 없거나 확인할 수 없을 때만 사용한다. 분류값을 모를 뿐인 경우에는 `unknown`을 사용한다.
