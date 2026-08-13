import math


def haversine_km(a: dict, b: dict) -> float:
    r = 6371
    d_lat = math.radians(b["lat"] - a["lat"])
    d_lon = math.radians(b["lon"] - a["lon"])
    lat1 = math.radians(a["lat"])
    lat2 = math.radians(b["lat"])
    sin_d_lat = math.sin(d_lat / 2)
    sin_d_lon = math.sin(d_lon / 2)
    c = sin_d_lat**2 + math.cos(lat1) * math.cos(lat2) * sin_d_lon**2
    return round(2 * r * math.asin(math.sqrt(c)) * 10) / 10
