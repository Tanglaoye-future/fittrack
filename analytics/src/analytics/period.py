from datetime import date, datetime, timedelta, timezone
import re

from fastapi import HTTPException, status


_PERIOD_RE = re.compile(r"^(\d+)d$")


def parse_period(period: str | None, date_from: str | None, date_to: str | None) -> tuple[date, date]:
    """Mirror Nest's AnalyticsService.getDateRange: explicit range wins; else N-day window ending today (default 30)."""
    if date_from and date_to:
        try:
            return _parse_date(date_from), _parse_date(date_to)
        except ValueError as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"日期格式错误: {e}")

    days = 30
    if period:
        m = _PERIOD_RE.match(period)
        if m:
            days = int(m.group(1))
        else:
            # Nest falls back to int(period) if it parses; otherwise 30.
            try:
                days = int(period)
            except ValueError:
                days = 30
    today = datetime.now(timezone.utc).date()
    return today - timedelta(days=days), today


def _parse_date(s: str) -> date:
    # Accept "YYYY-MM-DD" or full ISO 8601
    try:
        return date.fromisoformat(s[:10])
    except ValueError:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
