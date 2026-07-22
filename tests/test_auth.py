def test_login_returns_bearer_token(client, user_credentials):
    response = client.post("/auth/login", data=user_credentials)

    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_wrong_password_returns_401(client, user_credentials):
    response = client.post(
        "/auth/login",
        data={"username": user_credentials["username"], "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"


def test_login_unknown_user_returns_401(client):
    response = client.post(
        "/auth/login", data={"username": "ghost", "password": "irrelevant-123"}
    )

    assert response.status_code == 401


def test_protected_route_without_token_returns_401(client):
    response = client.get("/participants")

    assert response.status_code == 401


def test_protected_route_with_garbage_token_returns_401(client):
    response = client.get(
        "/participants", headers={"Authorization": "Bearer not.a.jwt"}
    )

    assert response.status_code == 401


def test_protected_route_with_valid_token_returns_200(client, auth_headers):
    response = client.get("/participants", headers=auth_headers)

    assert response.status_code == 200
