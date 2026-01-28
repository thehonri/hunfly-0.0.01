import json
import os
import re
from collections import Counter
from dataclasses import dataclass
from typing import Any, Iterable


@dataclass(frozen=True)
class EndpointKey:
    method: str
    url_no_query: str


def normalize_url(url: str) -> str:
    url = re.sub(r"^https?://", "", url)
    return url.split("?", 1)[0]


def safe_get(d: Any, *keys: str) -> Any:
    cur: Any = d
    for k in keys:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(k)
    return cur


def load_har(path: str) -> dict[str, Any]:
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return json.load(f)


def iter_entries(har: dict[str, Any]) -> Iterable[dict[str, Any]]:
    entries = safe_get(har, "log", "entries")
    if isinstance(entries, list):
        for e in entries:
            if isinstance(e, dict):
                yield e


def main() -> None:
    har_path = os.path.normpath(os.path.join("artifacts", "dealism", "app.dealism.ai.har"))
    har = load_har(har_path)

    counts: Counter[EndpointKey] = Counter()

    for e in iter_entries(har):
        req = e.get("request")
        if not isinstance(req, dict):
            continue
        method = str(req.get("method") or "")
        url = str(req.get("url") or "")
        if not method or not url:
            continue
        key = EndpointKey(method=method, url_no_query=normalize_url(url))
        counts[key] += 1

    print(f"HAR: {har_path}")
    print(f"Total unique endpoints: {len(counts)}")
    print("\nTop endpoints (60):")
    for key, c in counts.most_common(60):
        print(f"{c:5d}  {key.method:6s}  {key.url_no_query}")


def redact_headers(headers: Any) -> list[dict[str, str]]:
    if not isinstance(headers, list):
        return []
    out: list[dict[str, str]] = []
    for h in headers:
        if not isinstance(h, dict):
            continue
        name = str(h.get("name") or "")
        value = str(h.get("value") or "")
        lname = name.lower()
        if lname in {"authorization", "cookie", "set-cookie", "x-csrf-token"}:
            value = "***"
        out.append({"name": name, "value": value})
    return out


def sample_entries(har_path: str, patterns: list[re.Pattern[str]], limit_per_pattern: int = 2) -> dict[str, Any]:
    har = load_har(har_path)
    samples: dict[str, Any] = {}
    counts: dict[str, int] = {p.pattern: 0 for p in patterns}

    for e in iter_entries(har):
        req = e.get("request")
        res = e.get("response")
        if not isinstance(req, dict) or not isinstance(res, dict):
            continue
        url = str(req.get("url") or "")
        url_nq = normalize_url(url)
        method = str(req.get("method") or "")
        for p in patterns:
            if counts[p.pattern] >= limit_per_pattern:
                continue
            if not p.search(url_nq):
                continue

            # request body
            post = req.get("postData")
            post_text = None
            if isinstance(post, dict):
                txt = post.get("text")
                if isinstance(txt, str):
                    post_text = txt

            # response body (truncate)
            content = res.get("content")
            content_text = None
            if isinstance(content, dict):
                txt = content.get("text")
                if isinstance(txt, str):
                    content_text = txt[:2000]  # hard cap

            key = f"{method} {url_nq}"
            samples.setdefault(p.pattern, []).append(
                {
                    "request": {
                        "method": method,
                        "url": url_nq,
                        "headers": redact_headers(req.get("headers")),
                        "postDataText": post_text,
                    },
                    "response": {
                        "status": res.get("status"),
                        "statusText": res.get("statusText"),
                        "headers": redact_headers(res.get("headers")),
                        "contentText": content_text,
                    },
                }
            )
            counts[p.pattern] += 1
            break

    return samples


def main_samples() -> None:
    har_path = os.path.normpath(os.path.join("artifacts", "dealism", "app.dealism.ai.har"))
    patterns = [
        re.compile(r"/inbox/poll_events/?$"),
        re.compile(r"/inbox/get_conversations/?$"),
        re.compile(r"/inbox/get_conversation_messages/?$"),
        re.compile(r"/inbox/send_message/?$"),
        re.compile(r"/inbox/pull_new_messages/?$"),
        re.compile(r"/channel-info/request_authorization/?$"),
        re.compile(r"/channel-info/query_authorization_result/?$"),
        re.compile(r"/sales-agents/?$"),
        re.compile(r"/playground/generate_recommended_reply/?$"),
    ]
    samples = sample_entries(har_path, patterns, limit_per_pattern=2)
    out_path = os.path.normpath(os.path.join("artifacts", "dealism", "dealism_samples.redacted.json"))
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)
    print(f"Wrote: {out_path}")


if __name__ == "__main__":
    main()
    print("\n---\n")
    main_samples()
