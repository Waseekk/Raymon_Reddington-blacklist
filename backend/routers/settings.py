from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database.engine import get_db
from database.models import User

router = APIRouter()


class SettingsResponse(BaseModel):
    has_api_key: bool
    api_key_preview: Optional[str] = None


class UpdateSettingsRequest(BaseModel):
    api_key: Optional[str] = None


@router.get("/settings", response_model=SettingsResponse)
def get_settings(user: User = Depends(get_current_user)):
    has_key = bool(user.api_key)
    preview = None
    if has_key:
        key = user.api_key
        preview = f"...{key[-4:]}" if len(key) >= 4 else "****"
    return SettingsResponse(has_api_key=has_key, api_key_preview=preview)


@router.patch("/settings", response_model=SettingsResponse)
def update_settings(
    body: UpdateSettingsRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user.api_key = body.api_key if body.api_key else None
    db.commit()
    has_key = bool(user.api_key)
    preview = None
    if has_key:
        key = user.api_key
        preview = f"...{key[-4:]}" if len(key) >= 4 else "****"
    return SettingsResponse(has_api_key=has_key, api_key_preview=preview)
