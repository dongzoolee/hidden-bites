from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.parse
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NOTEBOOK_PATH = ROOT / "notebooks" / "google-maps-review-word-frequency.ipynb"
DATASET_PREFIX = "datasets/google-maps-reviews-2026-05-16/"
URL_RE = re.compile(
    r"^https://raw\.githubusercontent\.com/dongzoolee/hidden-bites/(?:refs/heads/main|main)/(.+)$"
)


def load_notebook_urls() -> list[str]:
    notebook = json.loads(NOTEBOOK_PATH.read_text())
    urls: list[str] = []
    for cell in notebook.get("cells", []):
        source = "".join(cell.get("source", []))
        for line in source.splitlines():
            if "DATASET_URL" not in line or "raw.githubusercontent.com" not in line:
                continue
            match = re.search(r'"(https://raw\.githubusercontent\.com/[^"]+)"', line)
            if match is None:
                raise ValueError(f"DATASET_URL line has no raw URL: {line}")
            urls.append(match.group(1))
    return urls


def load_git_dataset_paths() -> list[str]:
    result = subprocess.run(
        [
            "git",
            "-c",
            "core.quotePath=false",
            "ls-tree",
            "-r",
            "--name-only",
            "HEAD",
            DATASET_PREFIX,
        ],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=True,
    )
    paths = [
        path
        for path in result.stdout.splitlines()
        if path.endswith(".json")
        and not path.endswith(".partial.json")
        and not path.endswith("run-metadata.json")
    ]
    return sorted(paths)


def decode_dataset_path(url: str) -> str:
    match = URL_RE.match(url)
    if match is None:
        raise ValueError(f"Unexpected raw URL format: {url}")
    return urllib.parse.unquote(match.group(1))


def http_status(url: str) -> str:
    result = subprocess.run(
        [
            "curl",
            "-L",
            "-I",
            "-s",
            "-o",
            "/dev/null",
            "-w",
            "%{http_code}",
            "--max-time",
            "12",
            url,
        ],
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        return f"curl:{result.returncode}"
    return result.stdout.strip()


def main() -> int:
    urls = load_notebook_urls()
    git_paths = load_git_dataset_paths()
    decoded_paths = [decode_dataset_path(url) for url in urls]

    errors: list[str] = []
    if len(urls) != 50:
        errors.append(f"Expected 50 notebook URLs, found {len(urls)}")
    if decoded_paths != git_paths:
        missing = sorted(set(git_paths) - set(decoded_paths))
        extra = sorted(set(decoded_paths) - set(git_paths))
        errors.append(f"Notebook URL paths do not match git dataset paths: missing={missing}, extra={extra}")

    for index, url in enumerate(urls, 1):
        status = http_status(url)
        if status != "200":
            errors.append(f"{index:03d} returned HTTP {status}: {url}")

    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1

    print("OK: 50 notebook dataset URLs match git tree and return HTTP 200")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
