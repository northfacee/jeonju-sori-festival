import asyncio
import json

from app.constants import MAX_WALK_KM
from app.graph.tools import REPORT_STAY_TOOL, SUMMARIZE_TRIP_TOOL, pick_day_stops_tool
from app.models.state import BuildState
from app.services.distance import haversine_km
from app.services.festival_data import DATE_LABELS, STOP_POOL, SURVEY_STEPS
from app.services.food_search import search_places
from app.services.geocode import geocode_place
from app.services.llm import call_tool, search_with_google
from app.services.time_utils import (
    closest_stop,
    dedupe_overlaps,
    find_free_slot,
    minutes_to_time,
    overlaps,
    slugify,
    sort_key,
    to_minutes,
)

DATE_ORDER = list(DATE_LABELS.keys())
DURATION_DAY_COUNT = {"day": 1, "night1": 2, "night2": 3}


# ── Phase 1: 그날의 실제 축제 프로그램 고르기 (사전 정리된 일정 데이터 사용) ──
def _summarize_stop(s: dict) -> dict:
    return {
        "id": s["id"],
        "time": f"{s['time']}-{s['timeEnd']}",
        "venue": s["venue"]["name"],
        "hall": s.get("hall"),
        "name": s["name"],
        "type": "무료 공연" if s.get("free") else "유료 공연",
        "desc": s.get("desc", ""),
    }


def _answer_lines(answers: dict) -> str:
    lines = []
    for step in SURVEY_STEPS:
        opt = next((o for o in step["options"] if o["id"] == answers.get(step["key"])), None)
        label = f"{opt['label']} ({opt['desc']})" if opt else "(답변 없음)"
        lines.append(f"- {step['question']} → {label}")
    return "\n".join(lines)


async def pick_day_stops(date: str, pool: list[dict], answers: dict, anchor_venue: dict | None) -> list[dict]:
    day_pool = [s for s in pool if s["date"] == date]
    if not day_pool:
        return []

    tool = pick_day_stops_tool([s["id"] for s in day_pool])

    walk_note = ""
    stay_note = ""
    if answers.get("transport") == "walk":
        anchor_hint = (
            f' 특히 "{anchor_venue["name"]}"({anchor_venue["address"]}) 근처를 우선하세요.' if anchor_venue else ""
        )
        walk_note = f"\n- 이동수단이 도보이므로, 서로 가까운(같은 공연장·건물 위주) 정류지를 고르세요.{anchor_hint}"
    elif anchor_venue:
        stay_note = (
            f'\n- 전날 밤 숙소가 "{anchor_venue["name"]}"({anchor_venue["address"]})였으니, '
            "그 근처에서 시작하는 동선을 우선 고려하세요."
        )

    prompt = f"""2026 전주세계소리축제 {DATE_LABELS[date]}에 실제로 열리는 프로그램 목록입니다. 아래 목록에만 있는 것을 골라 그날의 동선을 짜주세요.

[사용자 답변]
{_answer_lines(answers)}

[{DATE_LABELS[date]} 실제 프로그램 목록]
{json.dumps([_summarize_stop(s) for s in day_pool], ensure_ascii=False)}

규칙:
- 시간이 겹치는 두 정류지를 동시에 고르면 안 됩니다.{walk_note}{stay_note}
- pick_day_stops 도구로만 답하세요."""

    try:
        args = await call_tool(prompt, tool, "pick_day_stops")
        by_id = {s["id"]: s for s in day_pool}
        picks = [by_id[i] for i in args.get("stopIds", []) if i in by_id]
    except Exception as err:
        print(f"[pick_day_stops] failed: {err}")
        picks = []

    picks = dedupe_overlaps(picks)

    anchor = anchor_venue
    if answers.get("transport") == "walk":
        if not anchor and picks:
            anchor = picks[0]["venue"]
        if anchor:
            picks = [s for s in picks if haversine_km(anchor, s["venue"]) <= MAX_WALK_KM]

    if len(picks) < 3:
        picked_ids = {p["id"] for p in picks}
        candidates = [s for s in day_pool if s["id"] not in picked_ids]
        if answers.get("transport") == "walk" and anchor:
            candidates = [s for s in candidates if haversine_km(anchor, s["venue"]) <= MAX_WALK_KM]
        candidates.sort(key=sort_key)
        for cand in candidates:
            if len(picks) >= 4:
                break
            if any(overlaps(s, cand) for s in picks):
                continue
            picks.append(cand)

    return sorted(picks, key=sort_key)


# ── Phase 2: 전주시 공공데이터 "음식점기본정보"에서 근처 실제 음식점/카페 찾기 ──
async def to_stop_from_place(place: dict, date: str, anchor_venue: dict, walk: bool, kind_override: str | None = None) -> dict:
    if place.get("lat") is not None and place.get("lon") is not None:
        geo = {"lat": place["lat"], "lon": place["lon"]}
    else:
        geo = await geocode_place(place["name"], place["address"])

    if walk and geo and haversine_km(anchor_venue, geo) > MAX_WALK_KM * 2.5:
        geo = None

    return {
        "id": f"place-{slugify(place['name'])}-{date}",
        "date": date,
        "dateLabel": DATE_LABELS[date],
        "venue": {
            "key": slugify(place["name"]),
            "name": place["name"],
            "address": place["address"],
            "lat": geo["lat"] if geo else None,
            "lon": geo["lon"] if geo else None,
        },
        "name": place["name"],
        "time": None,
        "timeEnd": None,
        "kind": kind_override or ("cafe" if place.get("type") == "카페" else "food"),
        "desc": place.get("desc", ""),
    }


def place_items_into_slots(
    existing_stops: list[dict], items: list[dict], window_start_min: int, window_end_min: int, anchor_venue: dict
) -> list[dict]:
    placed = []
    working = list(existing_stops)
    for item in items:
        slot = find_free_slot(working, window_start_min, window_end_min, 45)
        if not slot:
            continue
        if item["venue"].get("lat") is None:
            item["venue"]["lat"] = anchor_venue["lat"]
            item["venue"]["lon"] = anchor_venue["lon"]
        stop = {**item, "time": slot["time"], "timeEnd": slot["timeEnd"]}
        working.append(stop)
        placed.append(stop)
    return placed


# ── 숙소: Gemini google_search 그라운딩 2단계(검색 → 구조화 추출) ──
async def search_accommodation(anchor_venue: dict, exclude_names: list[str], walk: bool) -> dict | None:
    walk_note = " 다음날 도보로 이동할 수 있도록, 도보 20~30분 이내에 시내 명소가 있는 곳이면 좋아." if walk else ""
    exclude_note = f" 다음 곳은 이미 추천했으니 제외해: {', '.join(exclude_names)}." if exclude_names else ""
    search_prompt = (
        f'지금 구글 검색으로, "{anchor_venue["name"]}"({anchor_venue["address"]}) 근처에 실제로 존재하고 '
        f"영업 중인 숙소(호텔, 게스트하우스 등) 1곳을 찾아줘.{walk_note}{exclude_note} "
        "실제 상호명과 정확한 도로명 주소, 추천 이유를 한국어로 정리해줘."
    )
    try:
        search_text = await search_with_google(search_prompt)
        extract_prompt = (
            f"다음은 방금 검색한 결과입니다:\n\n{search_text}\n\n"
            "여기서 실제로 존재하는 숙소 1곳의 정보를 report_stay 도구로 추출해줘. "
            "검색 결과에 없는 곳을 지어내면 안 돼."
        )
        return await call_tool(extract_prompt, REPORT_STAY_TOOL, "report_stay")
    except Exception as err:
        print(f"[search_accommodation] failed: {err}")
        return None


# ── 요일 창(연속 날짜) 고르기 ──
def pick_date_window(day_count: int) -> list[str]:
    max_start = len(DATE_ORDER) - day_count
    start_idx = min(3, max(0, max_start))
    return DATE_ORDER[start_idx : start_idx + day_count]


# ── LangGraph 노드 ──
def decide_dates_and_filter_node(state: BuildState) -> dict:
    answers = state["answers"]
    day_count = DURATION_DAY_COUNT.get(answers.get("duration"), 1)
    family_pool = [s for s in STOP_POOL if answers.get("companion") == "family" or not s.get("kidsOnly")]
    date_window = pick_date_window(day_count)
    walk = answers.get("transport") == "walk"
    return {
        "day_count": day_count,
        "family_pool": family_pool,
        "date_window": date_window,
        "walk": walk,
        "day_index": 0,
        "used_food_names": [],
        "used_stay_names": [],
        "previous_stay": None,
        "days": [],
    }


async def pick_day_stops_node(state: BuildState) -> dict:
    day_index = state["day_index"]
    date = state["date_window"][day_index]
    anchor_venue = state["previous_stay"]["venue"] if state.get("previous_stay") else None
    stops = await pick_day_stops(date, state["family_pool"], state["answers"], anchor_venue)
    return {"current_date": date, "current_stops": stops}


async def search_food_node(state: BuildState) -> dict:
    stops = state["current_stops"]
    date = state["current_date"]
    walk = state["walk"]
    used_food_names = state["used_food_names"]

    lunch_anchor = closest_stop(stops, 12 * 60 + 30) or stops[0]
    dinner_anchor = closest_stop(stops, 18 * 60 + 30) or stops[-1]

    # 점심에서 고른 곳을 저녁 후보에서 바로 빼기 위해 순서대로 처리한다.
    lunch_places = search_places(lunch_anchor["venue"], used_food_names, walk)
    dinner_places = search_places(dinner_anchor["venue"], used_food_names + [p["name"] for p in lunch_places], walk)

    lunch_items = list(
        await asyncio.gather(*(to_stop_from_place(p, date, lunch_anchor["venue"], walk) for p in lunch_places))
    )
    dinner_items = list(
        await asyncio.gather(*(to_stop_from_place(p, date, dinner_anchor["venue"], walk) for p in dinner_places))
    )

    placed_lunch = place_items_into_slots(stops, lunch_items, 11 * 60, 15 * 60, lunch_anchor["venue"])
    stops = dedupe_overlaps(stops + placed_lunch)
    placed_dinner = place_items_into_slots(stops, dinner_items, 17 * 60, 21 * 60, dinner_anchor["venue"])
    stops = dedupe_overlaps(stops + placed_dinner)

    new_used_food_names = used_food_names + [p["name"] for p in lunch_places] + [p["name"] for p in dinner_places]

    return {"current_stops": stops, "used_food_names": new_used_food_names}


async def search_stay_node(state: BuildState) -> dict:
    day_index = state["day_index"]
    date_window = state["date_window"]
    if day_index >= len(date_window) - 1:
        return {}

    stops = state["current_stops"]
    date = state["current_date"]
    walk = state["walk"]
    used_stay_names = state["used_stay_names"]
    last_stop = stops[-1]

    stay = await search_accommodation(last_stop["venue"], used_stay_names, walk)
    if not stay:
        return {}

    geo = await geocode_place(stay["name"], stay["address"])
    checkout_min = min(to_minutes(last_stop["timeEnd"]) + 30, 23 * 60)
    stay_stop = {
        "id": f"stay-{slugify(stay['name'])}-{date}",
        "date": date,
        "dateLabel": DATE_LABELS[date],
        "venue": {
            "key": slugify(stay["name"]),
            "name": stay["name"],
            "address": stay["address"],
            "lat": geo["lat"] if geo else last_stop["venue"]["lat"],
            "lon": geo["lon"] if geo else last_stop["venue"]["lon"],
        },
        "name": stay["name"],
        "time": minutes_to_time(checkout_min),
        "timeEnd": "익일 체크아웃",
        "kind": "stay",
        "desc": stay["desc"],
    }
    return {
        "current_stops": stops + [stay_stop],
        "used_stay_names": used_stay_names + [stay["name"]],
        "previous_stay": stay_stop,
    }


def finalize_day_node(state: BuildState) -> dict:
    day_index = state["day_index"]
    date = state["current_date"]
    day_entry = {
        "dayNumber": day_index + 1,
        "date": date,
        "dateLabel": DATE_LABELS[date],
        "stops": state["current_stops"],
    }
    return {"days": state["days"] + [day_entry], "day_index": day_index + 1}


async def summarize_trip_node(state: BuildState) -> dict:
    day_count = state["day_count"]
    days = state["days"]
    title = f"{day_count}일 전주소리축제 여행"
    reason = "설문 답변을 바탕으로 실제 프로그램과 전주시 등록 음식점 데이터를 조합해 일정을 구성했어요."
    try:
        summary_input = [
            {
                "day": d["dayNumber"],
                "date": d["dateLabel"],
                "stops": [{"name": s["name"], "time": s["time"], "kind": s.get("kind")} for s in d["stops"]],
            }
            for d in days
        ]
        prompt = (
            "아래는 방금 완성된 2026 전주세계소리축제 맞춤 여행 일정입니다. 전체 이름과, "
            "사용자 답변에 맞춰 왜 이렇게 짰는지 요약해줘.\n\n[일정]\n"
            f"{json.dumps(summary_input, ensure_ascii=False)}\n\n"
            "summarize_trip 도구로만 답하세요."
        )
        result = await call_tool(prompt, SUMMARIZE_TRIP_TOOL, "summarize_trip")
        title = result.get("title") or title
        reason = result.get("reason") or reason
    except Exception as err:
        print(f"[summarize_trip] failed: {err}")
    return {"title": title, "reason": reason}


# ── 조건부 엣지: 하루 루프 ──
def route_after_pick(state: BuildState) -> str:
    return "search_food" if state["current_stops"] else "finalize_day"


def route_after_finalize(state: BuildState) -> str:
    return "pick_day_stops" if state["day_index"] < len(state["date_window"]) else "summarize_trip"
