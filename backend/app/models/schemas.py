from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Answers(BaseModel):
    duration: str | None = None
    time: str | None = None
    companion: str | None = None
    transport: str | None = None
    budget: str | None = None


class BuildCourseRequest(BaseModel):
    answers: Answers


class Venue(CamelModel):
    key: str
    name: str
    address: str
    lat: float | None = None
    lon: float | None = None


class Stop(CamelModel):
    id: str
    date: str
    date_label: str
    venue: Venue
    name: str
    time: str | None = None
    time_end: str | None = None
    kind: str | None = None
    free: bool | None = None
    hall: str | None = None
    desc: str = ""
    kids_only: bool | None = None


class DayPlan(CamelModel):
    day_number: int
    date: str
    date_label: str
    stops: list[Stop]


class CourseResult(CamelModel):
    title: str
    reason: str
    days: list[DayPlan]
