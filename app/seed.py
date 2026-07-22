from app.config import get_settings
from app.crud.user import create_user, get_user_by_username
from app.database import SessionLocal
from app.schemas.user import UserCreate


def seed_user() -> None:
    """Create the configured seed user if it does not exist yet. Idempotent."""
    settings = get_settings()
    if not settings.seed_username or not settings.seed_password:
        return
    with SessionLocal() as db:
        if get_user_by_username(db, settings.seed_username) is None:
            create_user(
                db,
                UserCreate(
                    username=settings.seed_username, password=settings.seed_password
                ),
            )
