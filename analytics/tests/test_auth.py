def test_missing_token_returns_401(client):
    r = client.get("/api/v2/analytics/body-weight")
    assert r.status_code == 401
    body = r.json()
    assert body["code"] == 401
    assert "timestamp" in body
    assert body["path"] == "/api/v2/analytics/body-weight"


def test_invalid_token_returns_401(client):
    r = client.get(
        "/api/v2/analytics/body-weight",
        headers={"Authorization": "Bearer not-a-real-jwt"},
    )
    assert r.status_code == 401
    assert r.json()["message"] == "Token 无效"


def test_non_bearer_returns_401(client):
    r = client.get(
        "/api/v2/analytics/body-weight",
        headers={"Authorization": "Basic abc"},
    )
    assert r.status_code == 401
