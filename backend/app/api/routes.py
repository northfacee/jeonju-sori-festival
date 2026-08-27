from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.graph.build import BuildCourseError, build_course
from app.models.schemas import BuildCourseRequest, CourseResult

router = APIRouter()


@router.post("/api/build-course", response_model=CourseResult)
async def build_course_route(payload: BuildCourseRequest):
    try:
        result = await build_course(payload.answers.model_dump(by_alias=True), payload.festival)
        return CourseResult.model_validate(result)
    except BuildCourseError as err:
        return JSONResponse(status_code=err.status, content={"error": str(err)})
    except Exception as err:
        print(f"[build-course] failed: {err}")
        return JSONResponse(status_code=500, content={"error": str(err) or "코스 생성에 실패했습니다."})
