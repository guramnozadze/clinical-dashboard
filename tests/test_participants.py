import uuid

PAYLOAD = {
    "subject_id": "SUBJ-001",
    "study_group": "treatment",
    "enrollment_date": "2026-01-15",
    "status": "active",
    "age": 42,
    "gender": "F",
}


def _create(client, auth_headers, **overrides):
    return client.post(
        "/participants", json={**PAYLOAD, **overrides}, headers=auth_headers
    )


def test_create_participant_returns_201_with_generated_id(client, auth_headers):
    response = _create(client, auth_headers)

    assert response.status_code == 201
    body = response.json()
    assert uuid.UUID(body.pop("participant_id"))
    assert body == PAYLOAD


def test_create_duplicate_subject_id_returns_409(client, auth_headers):
    assert _create(client, auth_headers).status_code == 201

    response = _create(client, auth_headers, age=30)

    assert response.status_code == 409
    assert "SUBJ-001" in response.json()["detail"]


def test_create_negative_age_returns_422(client, auth_headers):
    response = _create(client, auth_headers, age=-1)

    assert response.status_code == 422


def test_create_future_enrollment_date_returns_422(client, auth_headers):
    response = _create(client, auth_headers, enrollment_date="2100-01-01")

    assert response.status_code == 422


def test_list_participants_returns_all_created(client, auth_headers):
    _create(client, auth_headers)
    _create(client, auth_headers, subject_id="SUBJ-002", study_group="control")

    response = client.get("/participants", headers=auth_headers)

    assert response.status_code == 200
    assert [p["subject_id"] for p in response.json()] == ["SUBJ-001", "SUBJ-002"]


def test_get_participant_by_id(client, auth_headers):
    created = _create(client, auth_headers).json()

    response = client.get(
        f"/participants/{created['participant_id']}", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json() == created


def test_get_unknown_participant_returns_404(client, auth_headers):
    response = client.get(
        "/participants/00000000-0000-0000-0000-000000000000", headers=auth_headers
    )

    assert response.status_code == 404


def test_get_malformed_uuid_returns_422(client, auth_headers):
    response = client.get("/participants/not-a-uuid", headers=auth_headers)

    assert response.status_code == 422
