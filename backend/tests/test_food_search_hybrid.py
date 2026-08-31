import unittest
from unittest.mock import AsyncMock, Mock, patch

import httpx

from app.services.food_search_hybrid import (
    dedupe_kakao_candidates,
    rerank_places_with_gemini_search,
    search_day_places_hybrid,
    search_places_hybrid,
)


ANCHOR = {"name": "한국소리문화의전당", "lat": 35.8549, "lon": 127.1277}


def kakao_document(place_id: str, name: str, code: str, distance: int) -> dict:
    return {
        "id": place_id,
        "place_name": name,
        "category_name": "음식점 > 한식" if code == "FD6" else "음식점 > 카페",
        "road_address_name": f"전주시 덕진구 {name}길 1",
        "address_name": "전주시 덕진구",
        "x": "127.1280",
        "y": "35.8550",
        "distance": str(distance),
        "phone": "063-000-0000",
        "place_url": f"https://place.map.kakao.com/{place_id}",
    }


def make_client(*, fail: bool = False) -> httpx.AsyncClient:
    async def handler(request: httpx.Request) -> httpx.Response:
        if fail:
            return httpx.Response(503, request=request)
        code = request.url.params["category_group_code"]
        documents = (
            [kakao_document("food-near", "가까운식당", code, 120), kakao_document("food-far", "검색추천식당", code, 420)]
            if code == "FD6"
            else [kakao_document("cafe-near", "가까운카페", code, 180), kakao_document("cafe-far", "검색추천카페", code, 460)]
        )
        return httpx.Response(200, json={"documents": documents}, request=request)

    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


class FoodSearchHybridTests(unittest.IsolatedAsyncioTestCase):
    def test_similar_names_at_same_address_are_deduplicated(self) -> None:
        candidates = [
            {
                "kakaoPlaceId": "first",
                "name": "돼지게티 전주송천에코점",
                "address": "전북특별자치도 전주시 덕진구 솔내1길 79",
                "kind": "food",
                "distanceKm": 0.31,
            },
            {
                "kakaoPlaceId": "second",
                "name": "돼지게티 송천에코점",
                "address": "전북특별자치도 전주시 덕진구 솔내1길 79",
                "kind": "food",
                "distanceKm": 0.32,
            },
        ]

        result = dedupe_kakao_candidates(candidates)

        self.assertEqual([place["kakaoPlaceId"] for place in result], ["first"])

    def test_different_businesses_at_same_address_are_kept(self) -> None:
        candidates = [
            {
                "kakaoPlaceId": "food-a",
                "name": "한옥비빔밥",
                "address": "전북특별자치도 전주시 완산구 중앙로 1",
                "kind": "food",
                "distanceKm": 0.2,
            },
            {
                "kakaoPlaceId": "food-b",
                "name": "전주칼국수",
                "address": "전북특별자치도 전주시 완산구 중앙로 1",
                "kind": "food",
                "distanceKm": 0.21,
            },
        ]

        result = dedupe_kakao_candidates(candidates)

        self.assertEqual(len(result), 2)

    async def test_gemini_key_is_not_written_into_prompt(self) -> None:
        candidates = [
            {
                "kakaoPlaceId": "food-near",
                "name": "가까운식당",
                "type": "식당",
                "kind": "food",
                "category": "음식점 > 한식",
                "address": "전주시 덕진구 식당길 1",
                "distanceKm": 0.12,
            }
        ]
        structured_model = Mock()
        structured_model.ainvoke = AsyncMock(return_value={"selectedPlaceIds": ["food-near"], "reason": "가깝습니다."})
        model = Mock()
        model.with_structured_output.return_value = structured_model

        with patch("app.services.food_search_hybrid.ChatGoogleGenerativeAI", return_value=model):
            result = await rerank_places_with_gemini_search(
                candidates,
                {
                    "preferences": {"companion": "family"},
                    "geminiApiKey": "never-put-this-secret-in-a-prompt",
                    "geminiModel": "gemini-3.7-flash",
                },
            )

        prompt = structured_model.ainvoke.await_args.args[0]
        self.assertNotIn("never-put-this-secret-in-a-prompt", prompt)
        self.assertEqual(result, ["food-near"])

    async def test_gemini_ids_rerank_kakao_candidates(self) -> None:
        async def reranker(candidates: list[dict], context: dict) -> list[str]:
            self.assertEqual(context["preferences"], {"companion": "family"})
            self.assertEqual(len(candidates), 4)
            return ["food-far", "cafe-far"]

        async with make_client() as client:
            result = await search_places_hybrid(
                ANCHOR,
                [],
                True,
                kakao_api_key="test-key",
                preferences={"companion": "family"},
                client=client,
                reranker=reranker,
            )

        self.assertEqual([place["name"] for place in result], ["검색추천식당", "검색추천카페"])
        self.assertTrue(all(place["source"] == "kakao" for place in result))
        self.assertTrue(all(place["placeUrl"].startswith("https://place.map.kakao.com/") for place in result))

    async def test_day_search_reranks_lunch_and_dinner_in_one_call(self) -> None:
        calls = 0

        async def day_reranker(lunch_candidates: list[dict], dinner_candidates: list[dict], context: dict) -> dict:
            nonlocal calls
            calls += 1
            return {
                "lunch": ["food-far", "cafe-far"],
                "dinner": ["food-near", "cafe-near"],
            }

        async with make_client() as client:
            lunch, dinner = await search_day_places_hybrid(
                ANCHOR,
                {**ANCHOR, "name": "덕진예술회관"},
                [],
                True,
                kakao_api_key="test-key",
                client=client,
                reranker=day_reranker,
            )

        self.assertEqual(calls, 1)
        self.assertEqual([place["name"] for place in lunch], ["검색추천식당", "검색추천카페"])
        self.assertEqual([place["name"] for place in dinner], ["가까운식당", "가까운카페"])

    async def test_invalid_model_ids_are_rejected_and_nearest_types_fill(self) -> None:
        async def bad_reranker(candidates: list[dict], context: dict) -> list[str]:
            return ["invented-place", "food-far"]

        async with make_client() as client:
            result = await search_places_hybrid(
                ANCHOR,
                [],
                True,
                kakao_api_key="test-key",
                client=client,
                reranker=bad_reranker,
            )

        self.assertEqual([place["name"] for place in result], ["검색추천식당", "가까운카페"])

    async def test_two_model_food_ids_are_balanced_with_nearest_cafe(self) -> None:
        async def food_only_reranker(candidates: list[dict], context: dict) -> list[str]:
            return ["food-far", "food-near"]

        async with make_client() as client:
            result = await search_places_hybrid(
                ANCHOR,
                [],
                True,
                kakao_api_key="test-key",
                client=client,
                reranker=food_only_reranker,
            )

        self.assertEqual([place["name"] for place in result], ["검색추천식당", "가까운카페"])

    async def test_without_gemini_uses_nearest_food_and_cafe(self) -> None:
        async with make_client() as client:
            result = await search_places_hybrid(
                ANCHOR,
                [],
                True,
                kakao_api_key="test-key",
                client=client,
            )

        self.assertEqual([place["name"] for place in result], ["가까운식당", "가까운카페"])

    async def test_kakao_failure_uses_csv_fallback(self) -> None:
        csv_rows = [
            {
                "name": "CSV식당",
                "address": "전주시 덕진구 CSV식당길 1",
                "lat": 35.8550,
                "lon": 127.1280,
                "type": "한식",
                "license": "일반음식점",
                "kind": "food",
            },
            {
                "name": "CSV카페",
                "address": "전주시 덕진구 CSV카페길 1",
                "lat": 35.8551,
                "lon": 127.1281,
                "type": "커피숍",
                "license": "휴게음식점",
                "kind": "cafe",
            },
        ]
        async with make_client(fail=True) as client:
            with patch("app.services.food_search_hybrid.get_restaurants", return_value=csv_rows):
                result = await search_places_hybrid(
                    ANCHOR,
                    [],
                    True,
                    kakao_api_key="test-key",
                    client=client,
                )

        self.assertEqual([place["name"] for place in result], ["CSV식당", "CSV카페"])
        self.assertTrue(all("공공데이터" in place["desc"] for place in result))


if __name__ == "__main__":
    unittest.main()
