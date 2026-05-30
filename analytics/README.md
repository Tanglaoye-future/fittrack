# FitFlow Analytics (Python)

Read-only analytics service for FitFlow Pro v2. Replaces the NestJS `/api/v2/analytics/*` module — same routes, same envelope, same JWT.

## Why Python here

Analytics is aggregation-heavy and read-only. Pandas + raw SQL beats Prisma + JS for grouping/rolling math, and isolating it as its own service lets CRUD (Nest today, Go later) evolve without touching this surface.

## Endpoints

All paths require a Bearer JWT signed with the same `JWT_SECRET` the Nest auth issues. All responses use the project envelope: `{ code, message, data, timestamp }`.

| Method | Path | Returns |
|---|---|---|
| GET | `/api/v2/analytics/strength/{exercise_id}` | `{ prs[], sessions[] }` — lifetime PRs + working-set history in window |
| GET | `/api/v2/analytics/body-weight` | `BodyRecord[]` — morning weight + body fat trend |
| GET | `/api/v2/analytics/macros` | `[{ date, kcal, protein, carbs, fat }]` — daily macro totals |
| GET | `/api/v2/analytics/daily-summary` | `DailySummary[]` — `daily_summaries` rows |
| GET | `/api/v2/analytics/prep-progress/{cycle_id}` | `{ cycle, progress_pct, days_elapsed, days_remaining, body_records }` |

Window selection (mirrors Nest):
- `?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD` — explicit range
- `?period=30d` — N days ending today (default 30)

## Setup

```powershell
cd analytics
py -3 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
copy .env.example .env
```

## Run

```powershell
.venv\Scripts\Activate.ps1
uvicorn analytics.main:app --host 0.0.0.0 --port 3010 --reload
```

Swagger: http://localhost:3010/docs

## Test

```powershell
pytest
```

Tests assume Postgres is reachable at the URL in `.env`. The DB does not need seed data — empty results are valid.

## Wiring from frontend

`frontend/src/lib/api-client.ts` currently points at `NEXT_PUBLIC_API_URL` (Nest on 3001). When analytics UI is built, point analytics calls at `http://localhost:3010/api/v2` instead — add a sibling client, e.g.:

```ts
const analyticsClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_ANALYTICS_API_URL ?? 'http://localhost:3010/api/v2',
});
```

CORS already allows ports 3002 and 3003.

## What it intentionally does NOT do

- No write endpoints — analytics is read-only by design.
- No ORM — `psycopg` raw SQL keeps the queries grep-able and lets pandas do the heavy lifting.
- No JWT issuance — that stays in Nest's `/auth/*`. This service only verifies tokens it sees.
