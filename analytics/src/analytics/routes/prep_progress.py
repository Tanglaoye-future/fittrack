from datetime import datetime, timezone
import math

from fastapi import APIRouter, Depends

from ..auth import CurrentUser, current_user
from ..db import fetch_all, fetch_one


router = APIRouter()


@router.get("/prep-progress/{cycle_id}")
def get_prep_progress(cycle_id: str, user: CurrentUser = Depends(current_user)):
    cycle = fetch_one(
        """
        SELECT * FROM prep_cycles WHERE id = %(cid)s AND user_id = %(uid)s
        """,
        {"cid": cycle_id, "uid": user.user_id},
    )
    if cycle is None:
        return None

    phases = fetch_all(
        "SELECT * FROM phase_configs WHERE prep_cycle_id = %(cid)s ORDER BY week_start ASC",
        {"cid": cycle_id},
    )
    cycle["phases"] = phases

    start_date = cycle["start_date"]
    end_date = cycle["end_date"]
    today = datetime.now(timezone.utc).date()

    body_records = fetch_all(
        """
        SELECT measurement_date, morning_weight_kg, body_fat_percentage
        FROM body_records
        WHERE user_id = %(uid)s
          AND measurement_date BETWEEN %(frm)s AND %(today)s
          AND deleted_at IS NULL
        ORDER BY measurement_date ASC
        """,
        {"uid": user.user_id, "frm": start_date, "today": today},
    )

    total_days = max(1, math.ceil((end_date - start_date).days))
    days_elapsed = max(0, math.ceil((today - start_date).days))

    return {
        "cycle": cycle,
        "progress_pct": round((days_elapsed / total_days) * 100) if total_days else 0,
        "days_elapsed": days_elapsed,
        "days_remaining": max(0, total_days - days_elapsed),
        "body_records": body_records,
    }
