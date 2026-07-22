import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError

from app.crud import participant as crud
from app.database import DbSession
from app.schemas.participant import (
    ParticipantCreate,
    ParticipantRead,
    ParticipantUpdate,
)
from app.security import get_current_user

router = APIRouter(
    prefix="/participants",
    tags=["participants"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=ParticipantRead, status_code=status.HTTP_201_CREATED)
def create_participant(payload: ParticipantCreate, db: DbSession) -> ParticipantRead:
    try:
        return crud.create_participant(db, payload)
    except IntegrityError:
        # The only unique constraint on participants is subject_id.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Participant with subject_id {payload.subject_id!r} already exists",
        )


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


@router.put("/{participant_id}", response_model=ParticipantRead)
def update_participant(
    participant_id: uuid.UUID, payload: ParticipantUpdate, db: DbSession
) -> ParticipantRead:
    participant = crud.get_participant(db, participant_id)
    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Participant {participant_id} not found",
        )
    return crud.update_participant(db, participant, payload)


@router.delete("/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_participant(participant_id: uuid.UUID, db: DbSession) -> None:
    participant = crud.get_participant(db, participant_id)
    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Participant {participant_id} not found",
        )
    crud.soft_delete_participant(db, participant)
