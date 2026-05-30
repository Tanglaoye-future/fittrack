from datetime import date, timedelta, datetime, timezone

from analytics.period import parse_period


def test_default_period_is_30_days():
    frm, to = parse_period(None, None, None)
    assert (to - frm).days == 30


def test_period_n_days():
    frm, to = parse_period("7d", None, None)
    assert (to - frm).days == 7


def test_explicit_range_wins():
    frm, to = parse_period("30d", "2026-01-01", "2026-01-10")
    assert frm == date(2026, 1, 1)
    assert to == date(2026, 1, 10)


def test_malformed_period_falls_back_to_30():
    frm, to = parse_period("garbage", None, None)
    assert (to - frm).days == 30


def test_to_is_today_utc():
    _, to = parse_period(None, None, None)
    assert to == datetime.now(timezone.utc).date()
