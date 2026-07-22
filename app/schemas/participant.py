import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.participant import Gender, ParticipantStatus, StudyGroup


class ParticipantBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    subject_id: str = Field(
        min_length=1,
        max_length=64,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9_-]*$",
        description="Alphanumeric study subject identifier, e.g. SUBJ-001",
    )
    study_group: StudyGroup
    enrollment_date: date
    status: ParticipantStatus
    age: int = Field(ge=0, le=120)
    gender: Gender

    @field_validator("enrollment_date")
    @classmethod
    def enrollment_date_not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("enrollment_date cannot be in the future")
        return value


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantRead(ParticipantBase):
    model_config = ConfigDict(from_attributes=True)

    participant_id: uuid.UUID
