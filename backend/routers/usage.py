from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from config import settings
from database.engine import get_db
from database.models import User, UserUsage

router = APIRouter()


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _reset_at() -> str:
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return tomorrow.isoformat()


@router.get("/usage")
def get_usage(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    row = db.query(UserUsage).filter_by(user_id=user.id, date=_today()).first()
    used = row.msg_count if row else 0
    limit = settings.daily_message_limit
    return {
        "used": used,
        "limit": limit,
        "remaining": max(0, limit - used),
        "reset_at": _reset_at(),
    }
