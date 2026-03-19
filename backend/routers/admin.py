from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from auth.dependencies import get_current_user
from config import settings
from database.engine import get_db
from database.models import User, Conversation, Message

router = APIRouter(prefix="/admin", tags=["admin"])


def require_admin(current_user: User = Depends(get_current_user)):
    if current_user.id != settings.admin_email:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin only.")
    return current_user


@router.get("/users")
def list_users(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        conv_count = db.query(func.count(Conversation.id)).filter_by(user_id=u.id).scalar()
        msg_count = (
            db.query(func.count(Message.id))
            .join(Conversation, Message.conv_id == Conversation.id)
            .filter(Conversation.user_id == u.id)
            .scalar()
        )
        result.append({
            "id": u.id,
            "name": u.name,
            "picture": u.picture,
            "provider": u.provider,
            "created_at": u.created_at,
            "conversations": conv_count,
            "messages": msg_count,
        })
    return {"total": len(result), "users": result}
