import unittest

from app.graph.nodes import place_required_meal
from app.services.time_utils import overlaps


VENUE = {
    "key": "book-culture-center",
    "name": "전주한벽문화관",
    "address": "전북특별자치도 전주시 완산구 전주천동로 20",
    "lat": 35.8133,
    "lon": 127.1572,
}


def program(stop_id: str, start: str, end: str) -> dict:
    return {
        "id": stop_id,
        "name": stop_id,
        "time": start,
        "timeEnd": end,
        "kind": "program",
        "venue": VENUE,
    }


def place(stop_id: str, kind: str) -> dict:
    return {
        "id": stop_id,
        "name": stop_id,
        "time": None,
        "timeEnd": None,
        "kind": kind,
        "venue": {**VENUE, "key": stop_id, "name": stop_id},
        "desc": "카카오맵 추천",
    }


class RequiredMealTests(unittest.TestCase):
    def assert_no_overlaps(self, stops: list[dict]) -> None:
        for index, stop in enumerate(stops):
            for other in stops[index + 1 :]:
                self.assertFalse(overlaps(stop, other), f"{stop['id']}와 {other['id']}가 겹칩니다.")

    def test_lunch_is_forced_into_screenshot_schedule(self) -> None:
        # 첨부 화면과 같은 시간 구성: 기존 방식은 45분 빈칸이 없어 점심을 누락했다.
        stops = [
            program("reading", "11:00", "13:00"),
            program("author-1", "13:00", "14:00"),
            program("author-2", "14:30", "15:30"),
            program("author-3", "16:00", "17:00"),
        ]

        result, placed = place_required_meal(
            stops,
            [place("lunch", "food"), place("lunch-cafe", "cafe")],
            11 * 60,
            15 * 60,
            12 * 60 + 30,
            VENUE,
        )

        meals = [stop for stop in result if stop.get("kind") == "food"]
        self.assertEqual(len(meals), 1)
        self.assertEqual(meals[0]["time"], "13:00")
        self.assertEqual(meals[0]["timeEnd"], "13:45")
        self.assertNotIn("author-1", {stop["id"] for stop in result})
        self.assertEqual(len(placed), 2)
        self.assert_no_overlaps(result)

    def test_dinner_is_forced_when_evening_is_full(self) -> None:
        stops = [
            program("evening-1", "17:00", "18:00"),
            program("evening-2", "18:00", "19:00"),
            program("evening-3", "19:00", "20:00"),
            program("evening-4", "20:00", "21:00"),
        ]

        result, _ = place_required_meal(
            stops,
            [place("dinner", "food")],
            17 * 60,
            21 * 60,
            18 * 60 + 30,
            VENUE,
        )

        dinners = [stop for stop in result if stop.get("kind") == "food"]
        self.assertEqual(len(dinners), 1)
        self.assertGreaterEqual(dinners[0]["time"], "17:00")
        self.assertLessEqual(dinners[0]["timeEnd"], "21:00")
        self.assert_no_overlaps(result)

    def test_free_slot_nearest_preferred_time_does_not_remove_program(self) -> None:
        stops = [
            program("morning", "11:00", "12:00"),
            program("afternoon", "14:00", "15:00"),
        ]

        result, _ = place_required_meal(
            stops,
            [place("lunch", "food")],
            11 * 60,
            15 * 60,
            12 * 60 + 30,
            VENUE,
        )

        lunch = next(stop for stop in result if stop["id"] == "lunch")
        self.assertEqual((lunch["time"], lunch["timeEnd"]), ("12:30", "13:15"))
        self.assertEqual({"morning", "afternoon", "lunch"}, {stop["id"] for stop in result})
        self.assert_no_overlaps(result)


if __name__ == "__main__":
    unittest.main()
