def test_success_envelope_shape(client, auth_headers):
    r = client.get("/api/v2/analytics/body-weight", headers=auth_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["code"] == 0
    assert body["message"] == "success"
    assert "timestamp" in body
    assert "data" in body
    # Empty DB or unknown user → empty array, but never null
    assert isinstance(body["data"], list)


def test_macros_returns_list(client, auth_headers):
    r = client.get("/api/v2/analytics/macros?period=30d", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json()["data"], list)


def test_daily_summary_returns_list(client, auth_headers):
    r = client.get("/api/v2/analytics/daily-summary?period=7d", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json()["data"], list)


def test_strength_returns_pr_and_sessions(client, auth_headers):
    r = client.get(
        "/api/v2/analytics/strength/00000000-0000-0000-0000-000000000000?period=30d",
        headers=auth_headers,
    )
    assert r.status_code == 200
    data = r.json()["data"]
    assert "prs" in data and isinstance(data["prs"], list)
    assert "sessions" in data and isinstance(data["sessions"], list)


def test_prep_progress_unknown_cycle_returns_null(client, auth_headers):
    r = client.get(
        "/api/v2/analytics/prep-progress/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["data"] is None
