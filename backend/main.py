import os

from fastapi import FastAPI

from app.api.routes import router
from app.config import settings

if settings.langsmith_tracing:
    os.environ.setdefault("LANGSMITH_TRACING", "true")
    os.environ.setdefault("LANGSMITH_API_KEY", settings.langsmith_api_key)
    os.environ.setdefault("LANGSMITH_PROJECT", settings.langsmith_project)

app = FastAPI(title="Jeonju Sori Festival AI Course Builder")
app.include_router(router)
