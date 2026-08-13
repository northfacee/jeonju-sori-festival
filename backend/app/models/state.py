from typing import Any, TypedDict


class BuildState(TypedDict):
    answers: dict[str, Any]
    day_count: int
    date_window: list[str]
    family_pool: list[dict]
    walk: bool

    day_index: int
    used_food_names: list[str]
    used_stay_names: list[str]
    previous_stay: dict | None

    current_date: str
    current_stops: list[dict]

    days: list[dict]
    title: str
    reason: str
