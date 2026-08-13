import httpx

USER_AGENT = "jeonju-sorifestival-app/1.0 (course planner demo)"


async def geocode(query: str) -> dict | None:
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": query, "format": "json", "limit": 1, "countrycodes": "kr"}
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(url, params=params, headers={"User-Agent": USER_AGENT})
            data = res.json()
        if data:
            return {"lat": float(data[0]["lat"]), "lon": float(data[0]["lon"])}
    except Exception as err:
        print(f"[geocode] failed for {query}: {err}")
    return None


async def geocode_place(name: str, address: str) -> dict | None:
    return await geocode(f"전주 {name}") or await geocode(address)
