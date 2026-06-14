import argparse
import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from kiwipiepy import Kiwi
from langdetect import DetectorFactory, LangDetectException, detect


SOURCE_ADJ_STOPWORDS = {
    "있다",
    "없다",
    "같다",
    "되다",
    "아니다",
    "이다",
    "많다",
    "적다",
    "크다",
    "작다",
    "길다",
    "짧다",
    "높다",
    "낮다",
    "넓다",
    "좁다",
    "옳다",
    "그렇다",
    "이렇다",
    "저렇다",
    "어떻다",
    "다르다",
}

REPORT_ADJ_STOPWORDS = {
    "맛있다",
    "좋다",
    "없다",
    "많다",
    "같다",
    "있다",
    "싶다",
    "되다",
    "않다",
    "크다",
    "작다",
    "길다",
    "짧다",
    "높다",
    "낮다",
}

CATEGORY_DRAFT = {
    "🌱 평온/일상": ["괜찮다", "평범하다", "적당하다", "무난하다", "익숙하다", "알맞다", "단순하다"],
    "✨ 긍정/온화": ["훌륭하다", "만족스럽다", "깔끔하다", "신선하다", "친절하다", "부드럽다", "따뜻하다"],
    "🔥 강렬/압도": ["최고", "대박", "엄청나다", "특별하다", "놀랍다", "진하다", "깊다", "매콤하다"],
    "😤 부정/불편": ["아쉽다", "실망스럽다", "비싸다", "나쁘다", "불쾌하다", "지루하다", "힘들다", "느끼하다"],
}


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default="datasets/google-maps-reviews-2026-05-16")
    parser.add_argument("--output", default="datasets/derived/review-adjectives.json")
    parser.add_argument("--top-limit", type=int, default=30)
    return parser.parse_args()


def detect_lang(text):
    if not isinstance(text, str) or len(text.strip()) == 0:
        return "unknown"

    try:
        return detect(text[:200])
    except LangDetectException:
        return "unknown"


def extract_adjectives(kiwi, text):
    try:
        tokens = kiwi.tokenize(text)
    except Exception:
        return []

    adjectives = []
    index = 0

    while index < len(tokens):
        token = tokens[index]
        tag = str(token.tag)

        if tag in ("VA", "VA-I"):
            lemma = token.lemma if token.lemma.endswith("다") else token.lemma + "다"
            if lemma not in SOURCE_ADJ_STOPWORDS:
                adjectives.append(lemma)
        elif tag == "XR" and index + 1 < len(tokens) and str(tokens[index + 1].tag).startswith("XS"):
            lemma = token.form + "하다"
            if lemma not in SOURCE_ADJ_STOPWORDS:
                adjectives.append(lemma)
            index += 1
        elif tag in ("NNG", "XR") and index + 1 < len(tokens) and str(tokens[index + 1].tag) == "XSA-I":
            suffix = tokens[index + 1].lemma
            if not suffix.endswith("다"):
                suffix += "다"
            lemma = token.form + suffix
            if lemma not in SOURCE_ADJ_STOPWORDS:
                adjectives.append(lemma)
            index += 1

        index += 1

    return adjectives


def counter_items(counter):
    return [{"adj": adjective, "count": count} for adjective, count in counter.most_common()]


def load_restaurant_files(input_dir):
    return sorted(path for path in Path(input_dir).glob("*.json") if re.match(r"^\d{3}-", path.name) and not path.name.endswith(".partial.json"))


def main():
    args = parse_args()
    input_dir = Path(args.input_dir)
    output_path = Path(args.output)
    DetectorFactory.seed = 0
    kiwi = Kiwi()

    global_counter = Counter()
    filtered_global_counter = Counter()
    per_restaurant = {}
    total_reviews = 0
    total_ko_reviews = 0
    total_adj_tokens = 0
    extraction_errors = 0
    seen_review_keys = set()

    for source_path in load_restaurant_files(input_dir):
        with source_path.open("r", encoding="utf-8") as file:
            payload = json.load(file)

        metadata = payload.get("metadata", {})
        place = metadata.get("place", {})
        rank = metadata.get("place_rank")
        place_name = place.get("name", "")
        adjective_counter = Counter()
        filtered_adjective_counter = Counter()
        ko_review_count = 0
        review_count = 0

        for review in payload.get("reviews", []):
            text = review.get("text", "")
            if not isinstance(text, str) or len(text.strip()) == 0:
                continue

            place_id = review.get("place_id") or place.get("place_id") or str(rank)
            review_key = f"{place_id}\u241f{text}"
            if review_key in seen_review_keys:
                continue
            seen_review_keys.add(review_key)

            review_count += 1
            total_reviews += 1

            if detect_lang(text) != "ko":
                continue

            ko_review_count += 1
            total_ko_reviews += 1
            adjectives = extract_adjectives(kiwi, text)

            if not adjectives:
                continue

            total_adj_tokens += len(adjectives)
            adjective_counter.update(adjectives)
            global_counter.update(adjectives)
            filtered = [adjective for adjective in adjectives if adjective not in REPORT_ADJ_STOPWORDS]
            filtered_adjective_counter.update(filtered)
            filtered_global_counter.update(filtered)

        if not isinstance(rank, int):
            extraction_errors += 1
            continue

        per_restaurant[rank] = {
            "place_rank": rank,
            "place_name": place_name,
            "review_count": review_count,
            "ko_review_count": ko_review_count,
            "adjective_token_count": sum(adjective_counter.values()),
            "filtered_adjective_token_count": sum(filtered_adjective_counter.values()),
            "adjective_counts": counter_items(adjective_counter),
            "filtered_adjective_counts": counter_items(filtered_adjective_counter),
            "top30_adjs": counter_items(filtered_adjective_counter)[: args.top_limit],
        }

    output = {
        "metadata": {
            "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "source": str(input_dir),
            "source_file_count": len(per_restaurant),
            "total_reviews": total_reviews,
            "total_ko_reviews": total_ko_reviews,
            "total_adj_tokens": total_adj_tokens,
            "unique_adj_count": len(global_counter),
            "full_adjective_counts": True,
            "adjective_counts_scope": "all_extracted_korean_review_adjectives",
            "filtered_adjective_counts_scope": "all_extracted_korean_review_adjectives_without_report_stopwords",
            "top30_adjs_scope": "top_30_filtered_adjective_counts",
            "source_stopwords_removed": sorted(SOURCE_ADJ_STOPWORDS),
            "stopwords_removed": sorted(REPORT_ADJ_STOPWORDS),
            "extraction_errors": extraction_errors,
        },
        "global_top100": counter_items(filtered_global_counter)[:100],
        "global_all_top100": counter_items(global_counter)[:100],
        "per_restaurant": [per_restaurant[rank] for rank in sorted(per_restaurant)],
        "category_draft": CATEGORY_DRAFT,
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as file:
        json.dump(output, file, ensure_ascii=False, indent=2)
        file.write("\n")

    print(json.dumps({
        "output": str(output_path),
        "source_file_count": len(per_restaurant),
        "total_reviews": total_reviews,
        "total_ko_reviews": total_ko_reviews,
        "total_adj_tokens": total_adj_tokens,
        "unique_adj_count": len(global_counter),
        "global_top5": [item["adj"] for item in output["global_top100"][:5]],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
