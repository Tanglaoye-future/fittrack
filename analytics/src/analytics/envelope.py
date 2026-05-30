from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import orjson
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def _default(obj: Any) -> Any:
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Cannot serialize {type(obj)}")


class EnvelopeJSONResponse(JSONResponse):
    media_type = "application/json"

    def render(self, content: Any) -> bytes:
        envelope = {
            "code": 0,
            "message": "success",
            "data": content,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        }
        return orjson.dumps(envelope, default=_default, option=orjson.OPT_NAIVE_UTC | orjson.OPT_SERIALIZE_NUMPY)


def _error_body(code: int, message: str, path: str, errors: dict | None = None) -> dict:
    body = {
        "code": code,
        "message": message,
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "path": path,
    }
    if errors:
        body["errors"] = errors
    return body


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exc(request: Request, exc: StarletteHTTPException):
        detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_body(exc.status_code, detail, request.url.path),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exc(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=_error_body(
                status.HTTP_400_BAD_REQUEST,
                "请求参数错误",
                request.url.path,
                errors={"error": exc.errors()},
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_exc(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_body(status.HTTP_500_INTERNAL_SERVER_ERROR, "服务器内部错误", request.url.path),
        )
