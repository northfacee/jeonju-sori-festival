import random

from app.constants import TRANSPORT_RADIUS_KM
from app.services.distance import haversine_km
from app.services.restaurants import get_restaurants


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
    """소상공인 홍보 슬롯에 넣을 대안 가게. 추천 가게와 같은 종류(식당/카페)로 근처에서 하나 고른다."""
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
    radius_km = TRANSPORT_RADIUS_KM.get(transport, TRANSPORT_RADIUS_KM["transit"])
    picks = find_nearby_restaurants(anchor_venue, radius_km, exclude_names, count=2)
    return [_to_place(r) for r in picks]
