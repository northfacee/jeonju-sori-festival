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

NIGHT_TOUR_EVENTS: list[dict] = json.loads((DATA_DIR / "night_tour.json").read_text(encoding="utf-8"))

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
        # 축제장이 넉 군데로 흩어져 있어 숙소를 끼워 넣을 만하다.
        "supports_stay": True,
    },
    "bookfair": {
        "key": "bookfair",
        "name": _book_fair_raw["festival"]["name"],
        "info": _book_fair_raw["festival"],
        "venues": _book_fair_raw["venues"],
        "date_labels": _book_fair_raw["dateLabels"],
        "date_order": list(_book_fair_raw["dateLabels"].keys()),
        "stops": _book_fair_raw["stops"],
        # 독서대전에는 야간관광 프로그램이 없다.
        "night_tour": [],
        "preferred_start": 1,  # 09-12(토) — 사흘 중 프로그램이 가장 많다
        "supports_stay": True,
    },
}

DEFAULT_FESTIVAL_KEY = "sori"


def get_festival(key: str | None) -> dict:
    """축제 묶음을 돌려준다. 모르는 이름이면 기본(소리축제)으로 둔다."""
    return FESTIVALS.get(key or DEFAULT_FESTIVAL_KEY, FESTIVALS[DEFAULT_FESTIVAL_KEY])
