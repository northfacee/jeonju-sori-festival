from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Answers(CamelModel):
    duration: str | None = None
    time: str | None = None
    companion: str | None = None
    transport: str | None = None
    budget: str | None = None
    night_tour_ids: list[str] = []


class BuildCourseRequest(BaseModel):
    answers: Answers
    # 어떤 축제로 짤지. 안 보내면 지금까지처럼 소리축제로 짠다.
    festival: str | None = None


class Venue(CamelModel):
    key: str
    name: str
    address: str
    lat: float | None = None
    lon: float | None = None


class Promo(CamelModel):
    """소상공인 홍보 슬롯에 노출하는 대안 가게."""

    name: str
    address: str
    lat: float | None = None
    lon: float | None = None
    desc: str = ""


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
    promo: Promo | None = None


class DayPlan(CamelModel):
    day_number: int
    date: str
    date_label: str
    stops: list[Stop]


class CourseResult(CamelModel):
    title: str
    reason: str
    days: list[DayPlan]
