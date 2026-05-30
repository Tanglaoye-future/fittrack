from contextlib import contextmanager
from typing import Any, Iterator
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

from .config import settings


_pool: ConnectionPool | None = None


def init_pool() -> None:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(conninfo=settings.DATABASE_URL, min_size=1, max_size=10, kwargs={"row_factory": dict_row})
        _pool.wait()


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def get_conn() -> Iterator[Any]:
    if _pool is None:
        raise RuntimeError("DB pool not initialized")
    with _pool.connection() as conn:
        yield conn


def fetch_all(sql: str, params: tuple | dict | None = None) -> list[dict]:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchall()


def fetch_one(sql: str, params: tuple | dict | None = None) -> dict | None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        return cur.fetchone()
