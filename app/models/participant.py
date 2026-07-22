import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum as SAEnum, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class StudyGroup(str, enum.Enum):
    TREATMENT = "treatment"
    CONTROL = "control"


class ParticipantStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    WITHDRAWN = "withdrawn"


class Gender(str, enum.Enum):
    FEMALE = "F"
    MALE = "M"
    OTHER = "Other"


def _enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    return [member.value for member in enum_cls]


class Participant(Base):
    __tablename__ = "participants"

    participant_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )
    subject_id: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    study_group: Mapped[StudyGroup] = mapped_column(
        SAEnum(StudyGroup, name="study_group", values_callable=_enum_values),
        nullable=False,
    )
    enrollment_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[ParticipantStatus] = mapped_column(
        SAEnum(ParticipantStatus, name="participant_status", values_callable=_enum_values),
        nullable=False,
    )
    age: Mapped[int] = mapped_column(nullable=False)
    gender: Mapped[Gender] = mapped_column(
        SAEnum(Gender, name="gender", values_callable=_enum_values),
        nullable=False,
    )
    # Soft-delete marker (ADR 0011): deleted participants stay in the table
    # (clinical data is never destroyed) but are invisible to the API. The
    # unique constraint on subject_id spans deleted rows on purpose - a
    # subject identifier is never reused within a study.
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
