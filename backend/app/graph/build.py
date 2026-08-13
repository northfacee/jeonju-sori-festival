from langgraph.graph import END, START, StateGraph

from app.config import settings
from app.graph.nodes import (
    decide_dates_and_filter_node,
    finalize_day_node,
    pick_day_stops_node,
    route_after_finalize,
    route_after_pick,
    search_food_node,
    search_night_tour_node,
    search_stay_node,
    summarize_trip_node,
)
from app.models.state import BuildState


class BuildCourseError(Exception):
    def __init__(self, message: str, status: int = 500):
        super().__init__(message)
        self.status = status


def _build_graph():
    graph = StateGraph(BuildState)

    graph.add_node("decide_dates_and_filter", decide_dates_and_filter_node)
    graph.add_node("pick_day_stops", pick_day_stops_node)
    graph.add_node("search_food", search_food_node)
    graph.add_node("search_night_tour", search_night_tour_node)
    graph.add_node("search_stay", search_stay_node)
    graph.add_node("finalize_day", finalize_day_node)
    graph.add_node("summarize_trip", summarize_trip_node)

    graph.add_edge(START, "decide_dates_and_filter")
    graph.add_edge("decide_dates_and_filter", "pick_day_stops")
    graph.add_conditional_edges(
        "pick_day_stops",
        route_after_pick,
        {"search_food": "search_food", "finalize_day": "finalize_day"},
    )
    graph.add_edge("search_food", "search_night_tour")
    graph.add_edge("search_night_tour", "search_stay")
    graph.add_edge("search_stay", "finalize_day")
    graph.add_conditional_edges(
        "finalize_day",
        route_after_finalize,
        {"pick_day_stops": "pick_day_stops", "summarize_trip": "summarize_trip"},
    )
    graph.add_edge("summarize_trip", END)

    return graph.compile()


course_graph = _build_graph()


async def build_course(answers: dict | None) -> dict:
    if not settings.gemini_api_key:
        raise BuildCourseError("GEMINI_API_KEY가 설정되지 않았습니다.", status=503)
    if not answers or not isinstance(answers, dict):
        raise BuildCourseError("answers가 필요합니다.", status=400)

    initial_state: BuildState = {
        "answers": answers,
        "day_count": 0,
        "date_window": [],
        "family_pool": [],
        "walk": False,
        "day_index": 0,
        "used_food_names": [],
        "used_stay_names": [],
        "used_night_tour_ids": [],
        "previous_stay": None,
        "current_date": "",
        "current_stops": [],
        "days": [],
        "title": "",
        "reason": "",
    }
    result = await course_graph.ainvoke(initial_state, config={"recursion_limit": 100})
    return {"title": result["title"], "reason": result["reason"], "days": result["days"]}
