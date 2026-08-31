"""카카오 로컬 API + Gemini Google Search 음식점 추천 모듈.

카카오 후보를 동행·이동수단·예산에 맞춰 Gemini로 재정렬하고, 외부 API가
실패하면 CSV 검색으로 즉시 되돌아간다.
"""

import asyncio
import json
import random
from collections.abc import Awaitable, Callable
from difflib import SequenceMatcher

import httpx
from langchain_google_genai import ChatGoogleGenerativeAI

from app.constants import TRANSPORT_RADIUS_KM
from app.services.distance import haversine_km
from app.services.restaurants import get_restaurants

KAKAO_CATEGORY_URL = "https://dapi.kakao.com/v2/local/search/category.json"
KAKAO_CATEGORY_CODES = {"food": "FD6", "cafe": "CE7"}
KAKAO_CANDIDATE_SIZE = 10

GeminiReranker = Callable[[list[dict], dict], Awaitable[list[str]]]
DayGeminiReranker = Callable[[list[dict], list[dict], dict], Awaitable[dict[str, list[str]]]]

COMPANION_FOOD_GUIDANCE = {
    "family": "가족: 아이와 부모님이 함께 먹기 편하고 메뉴 선택 폭이 넓은 곳을 우선",
    "alone": "혼자: 1인이 편하게 식사하고 오래 기다리지 않아도 되는 혼밥 친화적인 곳을 우선",
    "friend": "친구: 함께 나눠 먹거나 대화하며 즐기기 좋은 활기차고 재미있는 곳을 우선",
    "couple": "커플: 분위기와 공간이 좋아 식사와 카페를 데이트 코스로 잇기 좋은 곳을 우선",
}

FOOD_BUDGET_GUIDANCE = {
    "saving": "가성비: 1인 대표 식사 가격이 15,000원 미만인 식당만 선택",
    "balanced": "균형: 1인 대표 식사 가격이 15,000원 이상 25,000원 미만인 식당만 선택",
    "splurge": "특별한 하루: 1인 대표 식사 가격이 25,000원 이상인 식당만 선택",
}


# ── 기존 food_search.py의 CSV 검색 로직 복사본 ──
def find_nearby_restaurants(anchor_venue: dict, radius_km: float, exclude_names: list[str], count: int) -> list[dict]:
    excluded = {n.strip().lower() for n in exclude_names}
    candidates = [
        {**r, "distanceKm": haversine_km(anchor_venue, r)}
        for r in get_restaurants()
        if r["name"].strip().lower() not in excluded
    ]
    candidates = [r for r in candidates if r["distanceKm"] <= radius_km]
    candidates.sort(key=lambda r: r["distanceKm"])

    if not candidates:
        return []

    # 매번 똑같은 1등만 나오지 않도록, 가까운 후보들 중에서 무작위로 고른다.
    near_pool = candidates[: max(count * 4, 8)]
    food_pool = [r for r in near_pool if r["kind"] == "food"]
    cafe_pool = [r for r in near_pool if r["kind"] == "cafe"]

    picked: list[dict] = []
    if count >= 2 and food_pool and cafe_pool:
        picked.append(random.choice(food_pool))
        picked.append(random.choice(cafe_pool))
    else:
        shuffled = near_pool[:]
        random.shuffle(shuffled)
        picked.extend(shuffled[:count])
    return picked[:count]


def _to_place(r: dict) -> dict:
    return {
        "name": r["name"],
        "address": r["address"],
        "lat": r["lat"],
        "lon": r["lon"],
        "type": "카페" if r["kind"] == "cafe" else "식당",
        "desc": f"{r['type']} · 전주시 등록 음식점(공공데이터) · 약 {r['distanceKm']:.1f}km",
    }


def find_promo_place(anchor_venue: dict, exclude_names: list[str], kind: str, transport: str) -> dict | None:
    """기존 소상공인 홍보 슬롯용 CSV 검색 복사본."""
    radius_km = TRANSPORT_RADIUS_KM.get(transport, TRANSPORT_RADIUS_KM["transit"])
    excluded = {n.strip().lower() for n in exclude_names}
    candidates = [
        {**r, "distanceKm": haversine_km(anchor_venue, r)}
        for r in get_restaurants()
        if r["kind"] == kind and r["name"].strip().lower() not in excluded
    ]
    candidates = [r for r in candidates if r["distanceKm"] <= radius_km]
    if not candidates:
        return None

    candidates.sort(key=lambda r: r["distanceKm"])
    return _to_place(random.choice(candidates[:12]))


def search_places(anchor_venue: dict, exclude_names: list[str], transport: str) -> list[dict]:
    """기존 CSV 검색과 같은 시그니처를 가진 실험용 폴백."""
    radius_km = TRANSPORT_RADIUS_KM.get(transport, TRANSPORT_RADIUS_KM["transit"])
    picks = find_nearby_restaurants(anchor_venue, radius_km, exclude_names, count=2)
    return [_to_place(r) for r in picks]


# ── 카카오 로컬 API 후보 검색 ──
def _kakao_document_to_place(document: dict, kind: str, anchor_venue: dict) -> dict | None:
    try:
        lat = float(document["y"])
        lon = float(document["x"])
    except (KeyError, TypeError, ValueError):
        return None

    distance_text = document.get("distance")
    try:
        distance_km = float(distance_text) / 1000 if distance_text else haversine_km(anchor_venue, {"lat": lat, "lon": lon})
    except (TypeError, ValueError):
        distance_km = haversine_km(anchor_venue, {"lat": lat, "lon": lon})

    name = str(document.get("place_name", "")).strip()
    address = str(document.get("road_address_name") or document.get("address_name") or "").strip()
    place_id = str(document.get("id", "")).strip()
    if not name or not address or not place_id:
        return None

    category = str(document.get("category_name", "")).strip()
    category_detail = category.split(" > ")[-1] if category else ("카페" if kind == "cafe" else "음식점")
    return {
        "kakaoPlaceId": place_id,
        "name": name,
        "address": address,
        "lat": lat,
        "lon": lon,
        "kind": kind,
        "type": "카페" if kind == "cafe" else "식당",
        "category": category,
        "phone": str(document.get("phone", "")).strip(),
        "placeUrl": str(document.get("place_url", "")).strip(),
        "distanceKm": distance_km,
        "desc": f"{category_detail} · 카카오맵 · 약 {distance_km:.1f}km",
    }


async def _fetch_kakao_category(
    client: httpx.AsyncClient,
    api_key: str,
    anchor_venue: dict,
    radius_km: float,
    kind: str,
) -> list[dict]:
    response = await client.get(
        KAKAO_CATEGORY_URL,
        headers={"Authorization": f"KakaoAK {api_key}"},
        params={
            "category_group_code": KAKAO_CATEGORY_CODES[kind],
            "x": anchor_venue["lon"],
            "y": anchor_venue["lat"],
            "radius": min(round(radius_km * 1000), 20_000),
            "sort": "distance",
            "size": KAKAO_CANDIDATE_SIZE,
        },
    )
    response.raise_for_status()
    documents = response.json().get("documents", [])
    places = [_kakao_document_to_place(document, kind, anchor_venue) for document in documents]
    return [place for place in places if place is not None]


def _normalized_text(value: str) -> str:
    return "".join(character.lower() for character in value if character.isalnum())


def _same_kakao_business(left: dict, right: dict) -> bool:
    """카카오에 중복 등록된 같은 업소인지 보수적으로 판정한다.

    같은 건물에 여러 가게가 있을 수 있으므로 좌표만으로 합치지 않는다. 동일한
    종류와 도로명 주소를 공유하면서 상호명까지 충분히 비슷할 때만 중복으로 본다.
    """
    if left["kakaoPlaceId"] == right["kakaoPlaceId"]:
        return True
    if left["kind"] != right["kind"]:
        return False

    left_address = _normalized_text(left["address"])
    right_address = _normalized_text(right["address"])
    if not left_address or left_address != right_address:
        return False

    left_name = _normalized_text(left["name"])
    right_name = _normalized_text(right["name"])
    if not left_name or not right_name:
        return False
    if left_name in right_name or right_name in left_name:
        return True
    return SequenceMatcher(None, left_name, right_name).ratio() >= 0.78


def dedupe_kakao_candidates(candidates: list[dict]) -> list[dict]:
    """거리순 후보에서 동일 업소의 중복 등록을 제거하고 가까운 항목을 남긴다."""
    deduped: list[dict] = []
    for candidate in sorted(candidates, key=lambda place: place["distanceKm"]):
        if any(_same_kakao_business(candidate, existing) for existing in deduped):
            continue
        deduped.append(candidate)
    return deduped


async def fetch_kakao_candidates(
    anchor_venue: dict,
    transport: str,
    api_key: str,
    *,
    client: httpx.AsyncClient | None = None,
) -> list[dict]:
    """음식점과 카페 후보를 동시에 가져와 거리순으로 반환한다."""
    if not api_key:
        raise ValueError("KAKAO_REST_API_KEY가 필요합니다.")

    radius_km = TRANSPORT_RADIUS_KM.get(transport, TRANSPORT_RADIUS_KM["transit"])
    owns_client = client is None
    api_client = client or httpx.AsyncClient(timeout=httpx.Timeout(4.0))
    try:
        food, cafe = await asyncio.gather(
            _fetch_kakao_category(api_client, api_key, anchor_venue, radius_km, "food"),
            _fetch_kakao_category(api_client, api_key, anchor_venue, radius_km, "cafe"),
        )
    finally:
        if owns_client:
            await api_client.aclose()

    return dedupe_kakao_candidates(food + cafe)


# ── Gemini Google Search 후보 재정렬 ──
def _candidate_summary(place: dict) -> dict:
    return {
        "kakaoPlaceId": place["kakaoPlaceId"],
        "name": place["name"],
        "type": place["type"],
        "category": place["category"],
        "address": place["address"],
        "distanceKm": round(place["distanceKm"], 2),
    }


def food_preference_guide(preferences: dict | None) -> dict:
    answers = preferences or {}
    return {
        "companion": COMPANION_FOOD_GUIDANCE.get(answers.get("companion"), "일반적인 방문 편의성을 우선"),
        "budget": FOOD_BUDGET_GUIDANCE.get(answers.get("budget"), "식당 가격 제한 없음"),
        "priceBasis": "가격 구간은 카페가 아닌 식당의 1인 대표 식사 가격에만 적용",
    }


async def rerank_places_with_gemini_search(candidates: list[dict], context: dict) -> list[str]:
    """Google Search로 최신성을 확인하되 카카오 후보 ID만 반환받는다."""
    allowed_ids = [place["kakaoPlaceId"] for place in candidates]
    if not allowed_ids:
        return []

    schema = {
        "type": "object",
        "properties": {
            "selectedPlaceIds": {
                "type": "array",
                "items": {"type": "string", "enum": allowed_ids},
                "minItems": 1,
                "maxItems": 2,
                "description": "추천 순서대로 고른 카카오 장소 ID",
            },
            "reason": {"type": "string", "description": "선택 근거를 한국어 한 문장으로 설명"},
        },
        "required": ["selectedPlaceIds", "reason"],
        "additionalProperties": False,
    }
    # 인증 정보는 모델 생성에만 쓰고 프롬프트 본문에는 절대 넣지 않는다.
    prompt_context = {key: value for key, value in context.items() if key not in {"geminiApiKey", "geminiModel"}}
    prompt = f"""전주 축제 관람객에게 추천할 식당과 카페를 고르세요.

[사용자와 일정 조건]
{json.dumps(prompt_context, ensure_ascii=False)}

[반드시 반영할 개인화 기준]
{json.dumps(food_preference_guide(context.get("preferences")), ensure_ascii=False)}

[카카오맵에서 거리순으로 찾은 허용 후보]
{json.dumps([_candidate_summary(place) for place in candidates], ensure_ascii=False)}

규칙:
- Google Search로 최근 영업 정보와 방문 목적 적합성을 확인하세요.
- 반드시 허용 후보의 kakaoPlaceId만 반환하세요.
- 가능하면 식당 1곳과 카페 1곳을 고르세요.
- 식당은 Google Search로 최신 메뉴의 1인 대표 가격을 확인하고 개인화 예산 구간을 반드시 지키세요.
- 카페에는 식사 가격 구간을 적용하지 마세요.
- 영업 여부가 불명확하거나 서로 다른 지역의 동명 가게는 선택하지 마세요.
- 거리와 사용자 조건을 최신 온라인 평판보다 우선하세요.
"""

    model = ChatGoogleGenerativeAI(
        model=context.get("geminiModel", "gemini-3.7-flash"),
        google_api_key=context.get("geminiApiKey"),
        thinking_level="low",
        max_output_tokens=512,
        max_retries=1,
    )
    structured_model = model.with_structured_output(schema, method="json_schema")
    result = await structured_model.ainvoke(prompt, tools=[{"google_search": {}}])
    return result.get("selectedPlaceIds", [])


async def rerank_day_places_with_gemini_search(
    lunch_candidates: list[dict], dinner_candidates: list[dict], context: dict
) -> dict[str, list[str]]:
    """점심·저녁 후보를 Google Search 한 번으로 함께 재정렬한다."""
    lunch_ids = [place["kakaoPlaceId"] for place in lunch_candidates]
    dinner_ids = [place["kakaoPlaceId"] for place in dinner_candidates]
    if not lunch_ids or not dinner_ids:
        return {"lunch": [], "dinner": []}

    schema = {
        "type": "object",
        "properties": {
            "lunchPlaceIds": {
                "type": "array",
                "items": {"type": "string", "enum": lunch_ids},
                "maxItems": 2,
                "description": "점심 시간대 추천 순서대로 고른 카카오 장소 ID",
            },
            "dinnerPlaceIds": {
                "type": "array",
                "items": {"type": "string", "enum": dinner_ids},
                "maxItems": 2,
                "description": "저녁 시간대 추천 순서대로 고른 카카오 장소 ID",
            },
            "reason": {"type": "string", "description": "전체 선택 근거를 한국어 한 문장으로 설명"},
        },
        "required": ["lunchPlaceIds", "dinnerPlaceIds", "reason"],
        "additionalProperties": False,
    }
    prompt_context = {key: value for key, value in context.items() if key not in {"geminiApiKey", "geminiModel"}}
    prompt = f"""전주 축제 관람객의 하루 식당과 카페를 고르세요.

[사용자와 일정 조건]
{json.dumps(prompt_context, ensure_ascii=False)}

[반드시 반영할 개인화 기준]
{json.dumps(food_preference_guide(context.get("preferences")), ensure_ascii=False)}

[점심 공연장 주변 카카오맵 후보]
{json.dumps([_candidate_summary(place) for place in lunch_candidates], ensure_ascii=False)}

[저녁 공연장 주변 카카오맵 후보]
{json.dumps([_candidate_summary(place) for place in dinner_candidates], ensure_ascii=False)}

규칙:
- Google Search로 최근 영업 정보와 방문 목적 적합성을 확인하세요.
- 각 목록에 허용된 kakaoPlaceId만 반환하세요.
- 점심과 저녁에 가능하면 식당 1곳과 카페 1곳씩 고르세요.
- 식당은 Google Search로 최신 메뉴의 1인 대표 가격을 확인하고 개인화 예산 구간을 반드시 지키세요.
- 카페에는 식사 가격 구간을 적용하지 마세요.
- 점심과 저녁에 같은 장소를 중복 선택하지 마세요.
- 영업 여부가 불명확하거나 서로 다른 지역의 동명 가게는 선택하지 마세요.
- 거리와 사용자 조건을 최신 온라인 평판보다 우선하세요.
"""
    model = ChatGoogleGenerativeAI(
        model=context.get("geminiModel", "gemini-3.7-flash"),
        google_api_key=context.get("geminiApiKey"),
        thinking_level="low",
        max_output_tokens=768,
        max_retries=1,
    )
    structured_model = model.with_structured_output(schema, method="json_schema")
    result = await structured_model.ainvoke(prompt, tools=[{"google_search": {}}])
    return {
        "lunch": result.get("lunchPlaceIds", []),
        "dinner": result.get("dinnerPlaceIds", []),
    }


def _validated_selection(candidates: list[dict], selected_ids: list[str], count: int = 2) -> list[dict]:
    """모델 ID를 화이트리스트로 검증하고 부족한 종류는 거리순으로 채운다."""
    by_id = {place["kakaoPlaceId"]: place for place in candidates}
    picked: list[dict] = []
    seen_ids: set[str] = set()
    available_kinds = {place["kind"] for place in candidates}
    picked_kinds: set[str] = set()
    for place_id in selected_ids:
        place = by_id.get(place_id)
        if place and place_id not in seen_ids:
            # 음식점과 카페가 모두 있을 때 같은 종류 두 곳을 모델이 골라도
            # 첫 장소만 받고 나머지 종류는 아래의 거리순 후보로 보충한다.
            if len(available_kinds) > 1 and place["kind"] in picked_kinds:
                continue
            picked.append(place)
            seen_ids.add(place_id)
            picked_kinds.add(place["kind"])
        if len(picked) >= count:
            return picked

    for desired_kind in ("food", "cafe"):
        if desired_kind in picked_kinds:
            continue
        candidate = next(
            (
                place
                for place in candidates
                if place["kind"] == desired_kind and place["kakaoPlaceId"] not in seen_ids
            ),
            None,
        )
        if candidate:
            picked.append(candidate)
            seen_ids.add(candidate["kakaoPlaceId"])
        if len(picked) >= count:
            return picked

    for candidate in candidates:
        if candidate["kakaoPlaceId"] not in seen_ids:
            picked.append(candidate)
            seen_ids.add(candidate["kakaoPlaceId"])
        if len(picked) >= count:
            break
    return picked


def _public_place(place: dict) -> dict:
    """기존 반환 필드를 유지하면서 지도 링크와 출처만 추가한다."""
    return {
        "name": place["name"],
        "address": place["address"],
        "lat": place["lat"],
        "lon": place["lon"],
        "type": place["type"],
        "desc": place["desc"],
        "kakaoPlaceId": place["kakaoPlaceId"],
        "placeUrl": place["placeUrl"],
        "phone": place["phone"],
        "source": "kakao",
    }


async def search_places_hybrid(
    anchor_venue: dict,
    exclude_names: list[str],
    transport: str,
    *,
    kakao_api_key: str,
    preferences: dict | None = None,
    gemini_api_key: str = "",
    gemini_model: str = "gemini-3.7-flash",
    client: httpx.AsyncClient | None = None,
    reranker: GeminiReranker | None = None,
) -> list[dict]:
    """카카오 후보를 Gemini로 재정렬하고 실패 시 기존 CSV 결과를 반환한다.

    ``reranker``를 주입할 수 있게 해 외부 API 호출 없이도 선택 검증과 폴백을
    테스트할 수 있다. Gemini 키가 없으면 카카오 거리순 결과를 사용한다.
    """
    try:
        candidates = await fetch_kakao_candidates(anchor_venue, transport, kakao_api_key, client=client)
        excluded = {name.strip().lower() for name in exclude_names}
        candidates = [place for place in candidates if place["name"].strip().lower() not in excluded]
        if not candidates:
            raise RuntimeError("카카오 검색 결과가 없습니다.")

        selected_ids: list[str] = []
        context = {
            "preferences": preferences or {},
            "transport": transport,
            "radiusKm": TRANSPORT_RADIUS_KM.get(transport, TRANSPORT_RADIUS_KM["transit"]),
            "anchor": {"name": anchor_venue.get("name"), "lat": anchor_venue["lat"], "lon": anchor_venue["lon"]},
            "geminiApiKey": gemini_api_key,
            "geminiModel": gemini_model,
        }
        active_reranker = reranker or (rerank_places_with_gemini_search if gemini_api_key else None)
        if active_reranker:
            try:
                selected_ids = await asyncio.wait_for(active_reranker(candidates, context), timeout=8.0)
            except Exception as err:
                print(f"[food_search_hybrid] Gemini rerank failed: {err}")

        picks = _validated_selection(candidates, selected_ids)
        if not picks:
            raise RuntimeError("선택 가능한 카카오 장소가 없습니다.")
        return [_public_place(place) for place in picks]
    except Exception as err:
        print(f"[food_search_hybrid] Kakao search failed; using CSV fallback: {err}")
        return search_places(anchor_venue, exclude_names, transport)


async def search_day_places_hybrid(
    lunch_anchor: dict,
    dinner_anchor: dict,
    exclude_names: list[str],
    transport: str,
    *,
    kakao_api_key: str,
    preferences: dict | None = None,
    gemini_api_key: str = "",
    gemini_model: str = "gemini-3.7-flash",
    client: httpx.AsyncClient | None = None,
    reranker: DayGeminiReranker | None = None,
) -> tuple[list[dict], list[dict]]:
    """하루의 점심·저녁 후보를 병렬 조회하고 Gemini는 한 번만 호출한다."""
    fetch_results = await asyncio.gather(
        fetch_kakao_candidates(lunch_anchor, transport, kakao_api_key, client=client),
        fetch_kakao_candidates(dinner_anchor, transport, kakao_api_key, client=client),
        return_exceptions=True,
    )
    excluded = {name.strip().lower() for name in exclude_names}

    def available(result: list[dict] | BaseException) -> list[dict]:
        if isinstance(result, BaseException):
            print(f"[food_search_hybrid] Kakao meal search failed: {result}")
            return []
        return [place for place in result if place["name"].strip().lower() not in excluded]

    lunch_candidates = available(fetch_results[0])
    dinner_candidates = available(fetch_results[1])
    context = {
        "preferences": preferences or {},
        "transport": transport,
        "radiusKm": TRANSPORT_RADIUS_KM.get(transport, TRANSPORT_RADIUS_KM["transit"]),
        "lunchAnchor": {
            "name": lunch_anchor.get("name"),
            "lat": lunch_anchor["lat"],
            "lon": lunch_anchor["lon"],
        },
        "dinnerAnchor": {
            "name": dinner_anchor.get("name"),
            "lat": dinner_anchor["lat"],
            "lon": dinner_anchor["lon"],
        },
        "geminiApiKey": gemini_api_key,
        "geminiModel": gemini_model,
    }
    selected = {"lunch": [], "dinner": []}
    active_reranker = reranker or (rerank_day_places_with_gemini_search if gemini_api_key else None)
    if active_reranker and lunch_candidates and dinner_candidates:
        try:
            selected = await asyncio.wait_for(
                active_reranker(lunch_candidates, dinner_candidates, context),
                timeout=8.0,
            )
        except Exception as err:
            print(f"[food_search_hybrid] Gemini day rerank failed: {err}")

    lunch_picks = _validated_selection(lunch_candidates, selected.get("lunch", []))
    if lunch_picks:
        lunch_places = [_public_place(place) for place in lunch_picks]
    else:
        lunch_places = search_places(lunch_anchor, exclude_names, transport)

    lunch_names = {place["name"].strip().lower() for place in lunch_places}
    lunch_ids = {place.get("kakaoPlaceId") for place in lunch_places if place.get("kakaoPlaceId")}
    dinner_candidates = [
        place
        for place in dinner_candidates
        if place["name"].strip().lower() not in lunch_names and place["kakaoPlaceId"] not in lunch_ids
    ]
    dinner_selected = [place_id for place_id in selected.get("dinner", []) if place_id not in lunch_ids]
    dinner_picks = _validated_selection(dinner_candidates, dinner_selected)
    if dinner_picks:
        dinner_places = [_public_place(place) for place in dinner_picks]
    else:
        dinner_places = search_places(
            dinner_anchor,
            exclude_names + [place["name"] for place in lunch_places],
            transport,
        )
    return lunch_places, dinner_places
