import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column, String, Text, Integer, DateTime, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship

from database.engine import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)          # email address
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)
    provider = Column(String, nullable=True)       # "google" | "facebook"
    api_key = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)

    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    usage = relationship("UserUsage", back_populates="user", cascade="all, delete-orphan")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=_uuid)
    conv_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)          # "user" | "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_now)

    conversation = relationship("Conversation", back_populates="messages")


class UserUsage(Base):
    __tablename__ = "user_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)          # "2025-01-15" UTC
    msg_count = Column(Integer, default=0)

    __table_args__ = (UniqueConstraint("user_id", "date", name="uq_user_date"),)

    user = relationship("User", back_populates="usage")
