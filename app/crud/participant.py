import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.participant import Participant
from app.schemas.participant import ParticipantCreate


def create_participant(db: Session, data: ParticipantCreate) -> Participant:
    participant = Participant(**data.model_dump())
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def list_participants(db: Session, skip: int = 0, limit: int = 100) -> Sequence[Participant]:
    stmt = (
        select(Participant)
        .order_by(Participant.enrollment_date, Participant.subject_id)
        .offset(skip)
        .limit(limit)
    )
    return db.scalars(stmt).all()


def get_participant(db: Session, participant_id: uuid.UUID) -> Participant | None:
    return db.get(Participant, participant_id)
