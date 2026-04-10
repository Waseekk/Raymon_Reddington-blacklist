from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from auth.dependencies import get_current_user
from config import settings
from database.engine import get_db
from database.models import User, Conversation, Message
from services import config_store

router = APIRouter(prefix="/admin", tags=["admin"])


class ConfigUpdate(BaseModel):
    daily_message_limit: int | None = None


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


@router.get("/users/{user_id}/conversations")
def list_user_conversations(
    user_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    convs = (
        db.query(Conversation)
        .filter_by(user_id=user_id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    result = []
    for c in convs:
        msg_count = db.query(func.count(Message.id)).filter_by(conv_id=c.id).scalar()
        result.append({
            "id": c.id,
            "title": c.title or "New Conversation",
            "message_count": msg_count,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            "created_at": c.created_at.isoformat() if c.created_at else None,
        })
    return result


@router.get("/conversations/{conv_id}/messages")
def get_conversation_messages(
    conv_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    conv = db.query(Conversation).filter_by(id=conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = (
        db.query(Message)
        .filter_by(conv_id=conv_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return {
        "conversation": {
            "id": conv.id,
            "title": conv.title or "New Conversation",
            "user_id": conv.user_id,
        },
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in msgs
        ],
    }


@router.get("/config")
def get_config(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return {"daily_message_limit": config_store.get_daily_limit(db)}


@router.patch("/config")
def update_config(
    body: ConfigUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    if body.daily_message_limit is not None:
        if body.daily_message_limit < 1:
            raise HTTPException(status_code=400, detail="Limit must be at least 1.")
        config_store.set_daily_limit(db, body.daily_message_limit)
    return {"daily_message_limit": config_store.get_daily_limit(db)}
