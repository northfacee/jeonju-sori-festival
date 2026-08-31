import unittest
from unittest.mock import AsyncMock, patch

from app.graph.nodes import _program_preference_notes, pick_day_stops, summarize_trip_node


DATE = "2026-09-12"
FESTIVAL = {
    "name": "전주독서대전",
    "date_labels": {DATE: "9월 12일(토)"},
}


def program(program_id: str, lon: float, start_hour: int) -> dict:
    return {
        "id": program_id,
        "date": DATE,
        "time": f"{start_hour:02d}:00",
        "timeEnd": f"{start_hour:02d}:45",
        "venue": {
            "name": f"장소 {program_id}",
            "lat": 35.8,
            "lon": lon,
        },
        "name": f"프로그램 {program_id}",
        "free": True,
        "desc": "테스트 프로그램",
    }


class SurveyPreferenceTests(unittest.IsolatedAsyncioTestCase):
    def test_companion_and_transport_guidance(self) -> None:
        self.assertIn("가족", _program_preference_notes({"companion": "family", "transport": "walk"}))
        self.assertIn("혼자", _program_preference_notes({"companion": "alone", "transport": "transit"}))
        self.assertIn("재미있는", _program_preference_notes({"companion": "friend", "transport": "transit"}))
        self.assertIn("데이트", _program_preference_notes({"companion": "couple", "transport": "car"}))
        self.assertIn("1km", _program_preference_notes({"transport": "walk"}))
        self.assertIn("3km", _program_preference_notes({"transport": "transit"}))
        self.assertIn("5km", _program_preference_notes({"transport": "car"}))

    async def test_program_selection_obeys_transport_radius(self) -> None:
        # 전주 위도에서 경도 약 0.022도는 약 2km이다.
        pool = [
            program("anchor", 127.0, 10),
            program("two-km", 127.022, 11),
            program("four-km", 127.044, 12),
        ]
        selected = {"stopIds": [item["id"] for item in pool]}

        with patch("app.graph.nodes.call_tool", new=AsyncMock(return_value=selected)):
            walk = await pick_day_stops(DATE, pool, {"transport": "walk"}, FESTIVAL)
            transit = await pick_day_stops(DATE, pool, {"transport": "transit"}, FESTIVAL)
            car = await pick_day_stops(DATE, pool, {"transport": "car"}, FESTIVAL)

        self.assertEqual([item["id"] for item in walk], ["anchor"])
        self.assertEqual([item["id"] for item in transit], ["anchor", "two-km"])
        self.assertEqual([item["id"] for item in car], ["anchor", "two-km", "four-km"])

    async def test_summary_receives_couple_date_direction(self) -> None:
        state = {
            "day_count": 1,
            "festival": FESTIVAL,
            "answers": {"companion": "couple", "transport": "transit", "budget": "balanced"},
            "days": [
                {
                    "dayNumber": 1,
                    "dateLabel": "9월 12일(토)",
                    "stops": [{"name": "분위기 있는 공연", "time": "15:00", "kind": "program"}],
                }
            ],
        }
        model_result = {"title": "둘만의 전주 데이트", "reason": "분위기 있는 코스입니다."}

        with patch("app.graph.nodes.call_tool", new=AsyncMock(return_value=model_result)) as call_tool:
            result = await summarize_trip_node(state)

        prompt = call_tool.await_args.args[0]
        self.assertIn("커플", prompt)
        self.assertIn("데이트 코스", prompt)
        self.assertEqual(result["title"], "둘만의 전주 데이트")


if __name__ == "__main__":
    unittest.main()
