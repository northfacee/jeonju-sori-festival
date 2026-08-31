def pick_day_stops_tool(stop_ids: list[str]) -> dict:
    return {
        "name": "pick_day_stops",
        "description": "그날 실제로 열리는 프로그램 중, 사용자 답변에 맞는 것들을 골라 하루 동선을 짠다.",
        "parameters": {
            "type": "object",
            "properties": {
                "stopIds": {
                    "type": "array",
                    "items": {"type": "string", "enum": stop_ids},
                    "description": "방문 순서대로 나열한 정류지 id 목록 (2~5개).",
                }
            },
            "required": ["stopIds"],
        },
    }


SUMMARIZE_TRIP_TOOL = {
    "name": "summarize_trip",
    "description": "완성된 여행 일정을 보고 전체 코스 이름과 추천 이유를 짧게 요약한다.",
    "parameters": {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "이 여행 전체의 이름. 한국어, 14자 내외."},
            "reason": {
                "type": "string",
                "description": "한국어 2~4문장. 답변 내용을 근거로 전체 일정을 왜 이렇게 짰는지 설명.",
            },
        },
        "required": ["title", "reason"],
    },
}
