import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database.engine import get_db
from database.models import Conversation, User

router = APIRouter()


@router.get("/conversations")
def list_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    convs = (
        db.query(Conversation)
        .filter_by(user_id=user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return [
        {
            "id": c.id,
            "title": c.title or "New Conversation",
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in convs
    ]


@router.post("/conversations", status_code=201)
def create_conversation(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = Conversation(id=str(uuid.uuid4()), user_id=user.id, title="New Conversation")
    db.add(conv)
    db.commit()
    db.refresh(conv)
    return {"id": conv.id, "title": conv.title}


@router.delete("/conversations/{conv_id}", status_code=204)
def delete_conversation(
    conv_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter_by(id=conv_id, user_id=user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(conv)
    db.commit()
