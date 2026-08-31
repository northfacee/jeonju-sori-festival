from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings


def get_chat_model(max_output_tokens: int = 2048) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        max_output_tokens=max_output_tokens,
        # 응답 속도와 서버리스 실행 시간을 우선해 low를 쓴다.
        # Gemini 3.7 Flash는 minimal을 지원하지 않는다.
        thinking_level="low",
        # 기본값(6)은 429 할당량 초과 시 SDK가 응답의 retryDelay(길게는 수십 초)를
        # 그대로 존중해 재시도하다가 Vercel 함수 제한 시간을 넘겨 504로 죽는다.
        # 1로 두면 재시도 없이 즉시 실패하고, 호출부의 try/except 폴백이 바로 동작한다.
        max_retries=1,
    )


async def call_tool(prompt: str, tool: dict, tool_name: str) -> dict:
    """단일 도구 호출을 강제해서 구조화된 인자를 받는다 (검색 없음)."""
    model = get_chat_model().bind_tools([tool], tool_choice=tool_name)
    response = await model.ainvoke(prompt)
    for call in response.tool_calls:
        if call["name"] == tool_name:
            return call["args"]
    raise RuntimeError(f"모델이 {tool_name} 결과를 반환하지 않았습니다.")
