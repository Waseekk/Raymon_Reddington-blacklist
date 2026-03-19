from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from config import settings
from database.models import UserUsage


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def check(user_id: str, db: Session) -> None:
    if user_id == settings.admin_email:
        return  # admin has unlimited messages
    today = _today()
    row = db.query(UserUsage).filter_by(user_id=user_id, date=today).first()
    if row and row.msg_count >= settings.daily_message_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Daily limit of {settings.daily_message_limit} messages reached. Resets at midnight UTC.",
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
