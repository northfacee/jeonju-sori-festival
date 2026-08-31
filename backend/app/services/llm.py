from langchain_google_genai import ChatGoogleGenerativeAI

from app.config import settings


def get_chat_model(max_output_tokens: int = 2048) -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.gemini_api_key,
        max_output_tokens=max_output_tokens,
        # Gemini 3 계열 "thinking" 모델은 답변 전에 숨은 추론 토큰을 쓰다가
        # 도구 호출을 아예 못 내놓는 경우가 있어서 최대한 꺼둔다.
        # Gemini 3.7 Flash는 minimal을 지원하지 않아 가장 낮은 low를 쓴다.
        thinking_level="medium",
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


async def search_with_google(prompt: str) -> str:
    """구글 검색 그라운딩으로 실시간 검색 결과 텍스트를 받는다 (숙소 검색에만 사용)."""
    model = get_chat_model()
    response = await model.ainvoke(prompt, tools=[{"google_search": {}}])
    content = response.content
    if isinstance(content, str):
        text = content.strip()
    else:
        text = "\n".join(
            block.get("text", "") for block in content if isinstance(block, dict) and block.get("type") == "text"
        ).strip()
    if not text:
        raise RuntimeError("구글 검색 결과가 비어있습니다.")
    return text
