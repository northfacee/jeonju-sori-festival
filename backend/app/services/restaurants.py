import csv
from functools import lru_cache
from pathlib import Path

CSV_PATH = Path(__file__).resolve().parent.parent / "data" / "jeonju-restaurants.csv"

# 진짜 식사/카페가 아닌 업종은 후보에서 뺀다.
EXCLUDE_TYPES = {"편의점", "극장", "유원지", "백화점", "출장조리", "감성주점"}
CAFE_LICENSES = {"휴게음식점", "제과점영업"}


def _load() -> list[dict]:
    with open(CSV_PATH, encoding="utf-8-sig", newline="") as f:
        rows = list(csv.reader(f))

    records: list[dict] = []
    for r in rows[1:]:
        if len(r) < 10:
            continue
        name = r[1].strip()
        road_address = r[2].strip()
        lot_address = r[3].strip()
        try:
            lat = float(r[4])
            lon = float(r[5])
        except ValueError:
            continue
        type_ = r[7].strip()
        license_ = r[8].strip()
        status = r[9].strip()

        if not name or status != "운영중":
            continue
        if lat < 30 or lon < 100:
            continue
        if type_ in EXCLUDE_TYPES:
            continue
        address = road_address or lot_address
        if not address:
            continue

        records.append(
            {
                "name": name,
                "address": address,
                "lat": lat,
                "lon": lon,
                "type": type_,
                "license": license_,
                "kind": "cafe" if license_ in CAFE_LICENSES else "food",
            }
        )
    return records


@lru_cache(maxsize=1)
def get_restaurants() -> list[dict]:
    return _load()
