from typing import Any, TypedDict


class BuildState(TypedDict):
    answers: dict[str, Any]
    # 어떤 축제의 데이터로 코스를 짤지. 규칙은 같고 데이터만 다르다.
    festival: dict[str, Any]
    day_count: int
    date_window: list[str]
    family_pool: list[dict]
    walk: bool

    day_index: int
    used_food_names: list[str]
    used_night_tour_ids: list[str]

    current_date: str
    current_stops: list[dict]

    days: list[dict]
    title: str
    reason: str
