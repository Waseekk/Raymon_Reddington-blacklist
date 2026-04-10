"""
Thin wrapper around the AppConfig table.
Always prefer DB value over env-var default so admin changes survive restarts.
"""
from sqlalchemy.orm import Session

from config import settings
from database.models import AppConfig


def get_daily_limit(db: Session) -> int:
    row = db.query(AppConfig).filter_by(key="daily_message_limit").first()
    if row:
        return int(row.value)
    return settings.daily_message_limit


def set_daily_limit(db: Session, value: int) -> None:
    row = db.query(AppConfig).filter_by(key="daily_message_limit").first()
    if row:
        row.value = str(value)
    else:
        db.add(AppConfig(key="daily_message_limit", value=str(value)))
    db.commit()
