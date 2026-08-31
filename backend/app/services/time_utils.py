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


def find_required_slot(
    existing_stops: list[dict],
    window_start_min: int,
    window_end_min: int,
    duration_min: int,
    preferred_start_min: int,
) -> tuple[dict, list[dict]]:
    """필수 일정의 최적 슬롯과 제거해야 할 충돌 일정을 반환한다.

    빈 슬롯이 있으면 선호 시간에 가장 가까운 곳을 고른다. 빈 슬롯이 전혀
    없으면 제거되는 일정의 총 길이와 개수가 가장 작은 슬롯을 골라 식사 시간을
    확보한다.
    """
    candidates: list[tuple[dict, list[dict], int]] = []
    start = window_start_min
    while start + duration_min <= window_end_min:
        slot = {
            "time": minutes_to_time(start),
            "timeEnd": minutes_to_time(start + duration_min),
        }
        conflicts = [stop for stop in existing_stops if overlaps(stop, slot)]
        candidates.append((slot, conflicts, start))
        start += 15

    if not candidates:
        raise ValueError("필수 일정을 배치할 수 있는 시간 범위가 없습니다.")

    free = [candidate for candidate in candidates if not candidate[1]]
    if free:
        slot, conflicts, _ = min(free, key=lambda candidate: abs(candidate[2] - preferred_start_min))
        return slot, conflicts

    def disruption(candidate: tuple[dict, list[dict], int]) -> tuple[int, int, int]:
        _, conflicts, start_min = candidate
        removed_minutes = sum(to_minutes(stop["timeEnd"]) - to_minutes(stop["time"]) for stop in conflicts)
        return removed_minutes, len(conflicts), abs(start_min - preferred_start_min)

    slot, conflicts, _ = min(candidates, key=disruption)
    return slot, conflicts


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
