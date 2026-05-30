from dataclasses import dataclass
from fastapi import Header, HTTPException, status
import jwt

from .config import settings


@dataclass
class CurrentUser:
    user_id: str
    email: str | None


def current_user(authorization: str | None = Header(default=None, alias="Authorization")) -> CurrentUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未授权")
    token = authorization.split(" ", 1)[1].strip()
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 已过期")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token 无效")

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token payload 缺少 sub")
    return CurrentUser(user_id=sub, email=payload.get("email"))
