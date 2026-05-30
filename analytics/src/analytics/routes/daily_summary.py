from fastapi import APIRouter, Depends, Query

from ..auth import CurrentUser, current_user
from ..db import fetch_all
from ..period import parse_period


router = APIRouter()


@router.get("/daily-summary")
def get_daily_summaries(
    period: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    user: CurrentUser = Depends(current_user),
):
    frm, to = parse_period(period, date_from, date_to)
    return fetch_all(
        """
        SELECT *
        FROM daily_summaries
        WHERE user_id = %(uid)s
          AND summary_date BETWEEN %(frm)s AND %(to)s
        ORDER BY summary_date ASC
        """,
        {"uid": user.user_id, "frm": frm, "to": to},
    )
