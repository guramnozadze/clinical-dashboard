import os

# Point the whole app at the test database BEFORE any app module is imported,
# because app.database creates the engine at import time.
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/clinical_trials_test",
)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine, text  # noqa: E402
from sqlalchemy.engine import make_url  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402


def _ensure_test_database() -> None:
    url = make_url(TEST_DATABASE_URL)
    admin_engine = create_engine(
        url.set(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"),
            {"name": url.database},
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{url.database}"'))
    admin_engine.dispose()


_ensure_test_database()

import app.models  # noqa: E402, F401  # register ORM models on Base.metadata
from app.crud.user import create_user  # noqa: E402
from app.database import Base, engine, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.schemas.user import UserCreate  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _tables():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    """Session wrapped in an outer transaction that is always rolled back.

    CRUD commits become savepoint releases (join_transaction_mode), so each
    test sees its own writes but leaves the database untouched.
    """
    with engine.connect() as connection:
        transaction = connection.begin()
        session = Session(bind=connection, join_transaction_mode="create_savepoint")
        try:
            yield session
        finally:
            session.close()
            transaction.rollback()


@pytest.fixture
def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()


@pytest.fixture
def user_credentials(db_session):
    credentials = {"username": "testuser", "password": "test-password-123"}
    create_user(db_session, UserCreate(**credentials))
    return credentials


@pytest.fixture
def auth_headers(client, user_credentials):
    response = client.post("/auth/login", data=user_credentials)
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
