import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict

from app.models.participant import Gender, ParticipantStatus, StudyGroup


class ParticipantBase(BaseModel):
    subject_id: str
    study_group: StudyGroup
    enrollment_date: date
    status: ParticipantStatus
    age: int
    gender: Gender


class ParticipantCreate(ParticipantBase):
    pass


class ParticipantRead(ParticipantBase):
    model_config = ConfigDict(from_attributes=True)

    participant_id: uuid.UUID
