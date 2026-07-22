import uuid
from collections.abc import Sequence
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.participant import Participant
from app.schemas.participant import ParticipantCreate, ParticipantUpdate


def create_participant(db: Session, data: ParticipantCreate) -> Participant:
    participant = Participant(**data.model_dump())
    db.add(participant)
    db.commit()
    db.refresh(participant)
    return participant


def list_participants(db: Session, skip: int = 0, limit: int = 100) -> Sequence[Participant]:
    stmt = (
        select(Participant)
        .where(Participant.deleted_at.is_(None))
        .order_by(Participant.enrollment_date, Participant.subject_id)
        .offset(skip)
        .limit(limit)
    )
    return db.scalars(stmt).all()


def get_participant(db: Session, participant_id: uuid.UUID) -> Participant | None:
    """Returns None for soft-deleted participants: the API treats them as gone."""
    participant = db.get(Participant, participant_id)
    if participant is None or participant.deleted_at is not None:
        return None
    return participant


def update_participant(
    db: Session, participant: Participant, data: ParticipantUpdate
) -> Participant:
    for field, value in data.model_dump().items():
        setattr(participant, field, value)
    db.commit()
    db.refresh(participant)
    return participant


def soft_delete_participant(db: Session, participant: Participant) -> None:
    participant.deleted_at = datetime.now(timezone.utc)
    db.commit()
