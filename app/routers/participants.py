import uuid

from fastapi import APIRouter, HTTPException, Query, status

from app.crud import participant as crud
from app.database import DbSession
from app.schemas.participant import ParticipantCreate, ParticipantRead

router = APIRouter(prefix="/participants", tags=["participants"])


@router.post("", response_model=ParticipantRead, status_code=status.HTTP_201_CREATED)
def create_participant(payload: ParticipantCreate, db: DbSession) -> ParticipantRead:
    return crud.create_participant(db, payload)


@router.get("", response_model=list[ParticipantRead])
def list_participants(
    db: DbSession,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
) -> list[ParticipantRead]:
    return crud.list_participants(db, skip=skip, limit=limit)


@router.get("/{participant_id}", response_model=ParticipantRead)
def get_participant(participant_id: uuid.UUID, db: DbSession) -> ParticipantRead:
    participant = crud.get_participant(db, participant_id)
    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Participant {participant_id} not found",
        )
    return participant
