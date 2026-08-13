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
