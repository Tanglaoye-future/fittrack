from fastapi import APIRouter, Depends, Query

from ..auth import CurrentUser, current_user
from ..db import fetch_all
from ..period import parse_period


router = APIRouter()


@router.get("/body-weight")
def get_body_weight_trends(
    period: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    user: CurrentUser = Depends(current_user),
):
    frm, to = parse_period(period, date_from, date_to)
    return fetch_all(
        """
        SELECT measurement_date, morning_weight_kg, body_fat_percentage
        FROM body_records
        WHERE user_id = %(uid)s
          AND measurement_date BETWEEN %(frm)s AND %(to)s
          AND deleted_at IS NULL
        ORDER BY measurement_date ASC
        """,
        {"uid": user.user_id, "frm": frm, "to": to},
    )
