from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from config import settings
from database.models import UserUsage
from services import config_store


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def check(user_id: str, db: Session) -> None:
    if user_id == settings.admin_email:
        return  # admin is always unlimited
    today = _today()
    limit = config_store.get_daily_limit(db)
    row = db.query(UserUsage).filter_by(user_id=user_id, date=today).first()
    if row and row.msg_count >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily limit of {limit} messages reached. Resets at midnight UTC.",
        )


def increment(user_id: str, db: Session) -> None:
    today = _today()
    row = db.query(UserUsage).filter_by(user_id=user_id, date=today).first()
    if row:
        row.msg_count += 1
        db.commit()
    else:
        db.add(UserUsage(user_id=user_id, date=today, msg_count=1))
        db.commit()
