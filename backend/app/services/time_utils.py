import unicodedata


def to_minutes(t: str) -> int:
    h, m = t.split(":")
    return int(h) * 60 + int(m)


def minutes_to_time(m: int) -> str:
    h, mm = divmod(m, 60)
    return f"{h:02d}:{mm:02d}"


def overlaps(a: dict, b: dict) -> bool:
    return to_minutes(a["time"]) < to_minutes(b["timeEnd"]) and to_minutes(b["time"]) < to_minutes(a["timeEnd"])


def sort_key(s: dict) -> int:
    return to_minutes(s["time"])


def dedupe_overlaps(items: list[dict]) -> list[dict]:
    sorted_items = sorted(items, key=sort_key)
    kept: list[dict] = []
    for s in sorted_items:
        if any(overlaps(k, s) for k in kept):
            continue
        kept.append(s)
    return kept


def find_free_slot(existing_stops: list[dict], window_start_min: int, window_end_min: int, duration_min: int) -> dict | None:
    t = window_start_min
    while t + duration_min <= window_end_min:
        candidate = {"time": minutes_to_time(t), "timeEnd": minutes_to_time(t + duration_min)}
        if not any(overlaps(s, candidate) for s in existing_stops):
            return candidate
        t += 15
    return None


def closest_stop(stops: list[dict], target_min: int) -> dict | None:
    if not stops:
        return None
    best = stops[0]
    best_diff = abs(to_minutes(best["time"]) - target_min)
    for s in stops[1:]:
        diff = abs(to_minutes(s["time"]) - target_min)
        if diff < best_diff:
            best, best_diff = s, diff
    return best


def slugify(name: str) -> str:
    chars: list[str] = []
    prev_dash = False
    for ch in name.lower():
        category = unicodedata.category(ch)
        if category.startswith("L") or category.startswith("N"):
            chars.append(ch)
            prev_dash = False
        elif not prev_dash:
            chars.append("-")
            prev_dash = True
    slug = "".join(chars).strip("-")
    return slug or "place"
