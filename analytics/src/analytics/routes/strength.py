from fastapi import APIRouter, Depends, Query

from ..auth import CurrentUser, current_user
from ..db import fetch_all
from ..period import parse_period


router = APIRouter()


@router.get("/strength/{exercise_id}")
def get_strength_trends(
    exercise_id: str,
    period: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    user: CurrentUser = Depends(current_user),
):
    """Lifetime PRs for the exercise + working-set history in the requested window.

    Working-set filter mirrors Nest: WORKING, CLUSTER, AMRAP — warmups and dropsets are excluded
    so the strength curve reflects what the athlete actually programmed against.
    """
    frm, to = parse_period(period, date_from, date_to)

    prs = fetch_all(
        """
        SELECT
            pr.id, pr.user_id, pr.exercise_id, pr.record_type,
            pr.value, pr.reps, pr.weight_kg, pr.achieved_at, pr.set_entry_id,
            json_build_object('name_zh', e.name_zh) AS exercise
        FROM personal_records pr
        JOIN exercises e ON e.id = pr.exercise_id
        WHERE pr.user_id = %(uid)s AND pr.exercise_id = %(eid)s
        ORDER BY pr.achieved_at DESC
        """,
        {"uid": user.user_id, "eid": exercise_id},
    )

    sessions = fetch_all(
        """
        SELECT session_date, weight_kg, reps
        FROM set_entries
        WHERE user_id = %(uid)s
          AND exercise_id = %(eid)s
          AND session_date BETWEEN %(frm)s AND %(to)s
          AND deleted_at IS NULL
          AND set_type IN ('WORKING', 'CLUSTER', 'AMRAP')
        ORDER BY session_date ASC
        """,
        {"uid": user.user_id, "eid": exercise_id, "frm": frm, "to": to},
    )

    return {"prs": prs, "sessions": sessions}
