# Vercel Python 서버리스 함수 진입점.
# 실제 FastAPI 앱/로직은 backend/ 아래에 있고, 여기서는 그걸 그대로 재노출만 한다
# (로컬 `uv run uvicorn main:app`과 코드 중복 없이 동일한 앱을 그대로 사용).
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from main import app  # noqa: E402
