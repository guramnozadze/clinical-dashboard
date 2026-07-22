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


UPDATE_PAYLOAD = {
    "study_group": "control",
    "enrollment_date": "2026-02-01",
    "status": "withdrawn",
    "age": 43,
    "gender": "F",
}


def _update(client, auth_headers, participant_id, **overrides):
    return client.put(
        f"/participants/{participant_id}",
        json={**UPDATE_PAYLOAD, **overrides},
        headers=auth_headers,
    )


def test_update_participant_changes_fields_but_not_subject_id(client, auth_headers):
    created = _create(client, auth_headers).json()

    response = _update(client, auth_headers, created["participant_id"])

    assert response.status_code == 200
    assert response.json() == {
        **UPDATE_PAYLOAD,
        "participant_id": created["participant_id"],
        "subject_id": "SUBJ-001",
    }


def test_update_rejects_subject_id_change_with_422(client, auth_headers):
    created = _create(client, auth_headers).json()

    response = _update(
        client, auth_headers, created["participant_id"], subject_id="SUBJ-999"
    )

    assert response.status_code == 422


def test_update_future_enrollment_date_returns_422(client, auth_headers):
    created = _create(client, auth_headers).json()

    response = _update(
        client, auth_headers, created["participant_id"], enrollment_date="2100-01-01"
    )

    assert response.status_code == 422


def test_update_unknown_participant_returns_404(client, auth_headers):
    response = _update(
        client, auth_headers, "00000000-0000-0000-0000-000000000000"
    )

    assert response.status_code == 404


def test_delete_participant_hides_it_from_the_api(client, auth_headers):
    created = _create(client, auth_headers).json()
    participant_id = created["participant_id"]

    response = client.delete(f"/participants/{participant_id}", headers=auth_headers)

    assert response.status_code == 204
    assert (
        client.get(f"/participants/{participant_id}", headers=auth_headers).status_code
        == 404
    )
    assert client.get("/participants", headers=auth_headers).json() == []


def test_delete_is_not_repeatable(client, auth_headers):
    created = _create(client, auth_headers).json()
    participant_id = created["participant_id"]

    assert (
        client.delete(f"/participants/{participant_id}", headers=auth_headers).status_code
        == 204
    )
    assert (
        client.delete(f"/participants/{participant_id}", headers=auth_headers).status_code
        == 404
    )


def test_delete_unknown_participant_returns_404(client, auth_headers):
    response = client.delete(
        "/participants/00000000-0000-0000-0000-000000000000", headers=auth_headers
    )

    assert response.status_code == 404


def test_update_deleted_participant_returns_404(client, auth_headers):
    created = _create(client, auth_headers).json()
    participant_id = created["participant_id"]
    client.delete(f"/participants/{participant_id}", headers=auth_headers)

    response = _update(client, auth_headers, participant_id)

    assert response.status_code == 404


def test_deleted_subject_id_stays_reserved(client, auth_headers):
    # Soft delete keeps the row, so the unique constraint still applies:
    # a subject identifier is never reused within a study (ADR 0011).
    created = _create(client, auth_headers).json()
    client.delete(f"/participants/{created['participant_id']}", headers=auth_headers)

    response = _create(client, auth_headers)

    assert response.status_code == 409
