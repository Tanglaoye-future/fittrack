from fastapi import APIRouter, Depends, Query
import pandas as pd

from ..auth import CurrentUser, current_user
from ..db import fetch_all
from ..period import parse_period


router = APIRouter()


@router.get("/macros")
def get_macro_trends(
    period: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    user: CurrentUser = Depends(current_user),
):
    """Daily macro totals over the window.

    Aggregation moved from JS reduce → pandas groupby. Same shape Nest returns:
    [{date: "YYYY-MM-DD", kcal, protein, carbs, fat}, ...] sorted ASC by date.
    """
    frm, to = parse_period(period, date_from, date_to)
    rows = fetch_all(
        """
        SELECT meal_date, total_kcal, total_protein, total_carbs, total_fat
        FROM meal_logs
        WHERE user_id = %(uid)s
          AND meal_date BETWEEN %(frm)s AND %(to)s
          AND deleted_at IS NULL
        """,
        {"uid": user.user_id, "frm": frm, "to": to},
    )

    if not rows:
        return []

    df = pd.DataFrame(rows)
    for col in ("total_kcal", "total_protein", "total_carbs", "total_fat"):
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    grouped = (
        df.groupby("meal_date", as_index=False)[["total_kcal", "total_protein", "total_carbs", "total_fat"]]
        .sum()
        .sort_values("meal_date")
    )

    return [
        {
            "date": row["meal_date"].isoformat() if hasattr(row["meal_date"], "isoformat") else str(row["meal_date"]),
            "kcal": float(row["total_kcal"]),
            "protein": float(row["total_protein"]),
            "carbs": float(row["total_carbs"]),
            "fat": float(row["total_fat"]),
        }
        for _, row in grouped.iterrows()
    ]
