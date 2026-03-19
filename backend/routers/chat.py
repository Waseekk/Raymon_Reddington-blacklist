import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database.engine import get_db, SessionLocal
from database.models import Conversation, Message, User
from services import claude_service, rag_service, rate_limiter

router = APIRouter()


class ChatRequest(BaseModel):
    conversation_id: str
    message: str


@router.post("/chat")
async def chat(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter_by(id=body.conversation_id, user_id=user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Capture before async generator — ORM session closes before stream finishes
    user_api_key = user.api_key

    if not user_api_key:
        rate_limiter.check(user.id, db)

    # Load last 20 messages (oldest first)
    history = (
        db.query(Message)
        .filter_by(conv_id=conv.id)
        .order_by(Message.created_at.desc())
        .limit(20)
        .all()
    )
    history = list(reversed(history))
    history_dicts = [{"role": m.role, "content": m.content} for m in history]

    rag_chunks = rag_service.get_context(body.message)
    system, messages = claude_service.build_messages(history_dicts, body.message, rag_chunks)

    # Save user message
    db.add(Message(conv_id=conv.id, role="user", content=body.message))
    db.commit()

    # Set title from first user message
    if not history:
        conv.title = body.message[:50] + ("..." if len(body.message) > 50 else "")
        db.commit()

    conv_id = conv.id
    user_id = user.id

    async def event_stream():
        chunks: list[str] = []
        try:
            async for chunk in claude_service.stream_response(system, messages, api_key=user_api_key):
                chunks.append(chunk)
                yield f"data: {json.dumps(chunk)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

        # Use a fresh session — the request-scoped session is already closed
        save_db = SessionLocal()
        try:
            full = "".join(chunks)
            if full:
                save_db.add(Message(conv_id=conv_id, role="assistant", content=full))
                if not user_api_key:
                    rate_limiter.increment(user_id, save_db)
                save_db.commit()
        finally:
            save_db.close()

        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
