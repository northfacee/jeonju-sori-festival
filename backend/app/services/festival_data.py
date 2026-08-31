import json
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

_venues_raw = json.loads((DATA_DIR / "venues.json").read_text(encoding="utf-8"))
_stop_pool_raw = json.loads((DATA_DIR / "stop_pool.json").read_text(encoding="utf-8"))

VENUES: dict = _venues_raw["venues"]
FESTIVAL: dict = _venues_raw["festival"]
DATE_LABELS: dict[str, str] = _stop_pool_raw["dateLabels"]
STOP_POOL: list[dict] = _stop_pool_raw["stops"]
DATE_ORDER: list[str] = list(DATE_LABELS.keys())

SURVEY_STEPS: list[dict] = json.loads((DATA_DIR / "survey_steps.json").read_text(encoding="utf-8"))

_night_tour_raw: list[dict] = json.loads((DATA_DIR / "night_tour.json").read_text(encoding="utf-8"))


def _night_tour_for(key: str) -> list[dict]:
    """그 축제 기간에 실제로 열리는 날짜만 남긴 야간관광 목록.

    야간관광은 5~11월 내내 매주 금·토 돌아서 축제마다 겹치는 날이 다르다.
    프로그램 내용은 같고 날짜만 다르므로 날짜만 갈아 끼운다.
    그 축제 기간에 한 번도 안 열리는 것은 아예 뺀다.
    """
    out = []
    for e in _night_tour_raw:
        dates = e["activeDates"].get(key) or []
        if dates:
            out.append({**e, "activeDates": dates})
    return out


# 소리축제 기준. 예전 이름 그대로 쓰는 곳이 있어서 남겨둔다.
NIGHT_TOUR_EVENTS: list[dict] = _night_tour_for("sori")

# ── 축제 묶음 ──
# 코스를 짜는 규칙은 축제마다 같고 데이터만 다르다. 그래서 데이터를 한 묶음으로 싸서
# 요청마다 골라 넣는다. 위쪽의 낱개 상수들은 소리축제를 가리킨 채 그대로 둔다 —
# 다른 데서 이미 그 이름으로 가져다 쓰고 있어서, 없애면 그쪽이 같이 깨진다.
_book_fair_raw = json.loads((DATA_DIR / "book_fair.json").read_text(encoding="utf-8"))

FESTIVALS: dict[str, dict] = {
    "sori": {
        "key": "sori",
        "name": FESTIVAL["name"],
        "info": FESTIVAL,
        "venues": VENUES,
        "date_labels": DATE_LABELS,
        "date_order": DATE_ORDER,
        "stops": STOP_POOL,
        "night_tour": NIGHT_TOUR_EVENTS,
        # 하루만 갈 사람에게 먼저 보여줄 날. 프로그램이 가장 많은 토요일로 둔다.
        "preferred_start": 3,  # 08-15(토)
    },
    "bookfair": {
        "key": "bookfair",
        "name": _book_fair_raw["festival"]["name"],
        "info": _book_fair_raw["festival"],
        "venues": _book_fair_raw["venues"],
        "date_labels": _book_fair_raw["dateLabels"],
        "date_order": list(_book_fair_raw["dateLabels"].keys()),
        "stops": _book_fair_raw["stops"],
        # 야간관광은 독서대전 기간(9/11 금, 9/12 토)에도 열린다. 게다가 완판본문화관은
        # 독서대전 행사장이라 소리축제 때보다 오히려 가깝다.
        "night_tour": _night_tour_for("bookfair"),
        "preferred_start": 1,  # 09-12(토) — 사흘 중 프로그램이 가장 많다
    },
}

DEFAULT_FESTIVAL_KEY = "sori"


def get_festival(key: str | None) -> dict:
    """축제 묶음을 돌려준다. 모르는 이름이면 기본(소리축제)으로 둔다."""
    return FESTIVALS.get(key or DEFAULT_FESTIVAL_KEY, FESTIVALS[DEFAULT_FESTIVAL_KEY])
