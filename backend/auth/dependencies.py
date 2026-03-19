"""FastAPI dependencies for authenticated routes."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database.engine import get_db
from database.models import User
from auth.jwt_validator import decode_nextauth_token

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Validate Bearer JWT, upsert user in DB, return User ORM object.
    Used as: user: User = Depends(get_current_user)
    """
    token_data = decode_nextauth_token(credentials.credentials)

    user = db.get(User, token_data["email"])
    if user is None:
        user = User(
            id=token_data["email"],
            name=token_data.get("name"),
            picture=token_data.get("picture"),
            provider=token_data.get("provider"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update profile fields if they changed
        changed = False
        for field in ("name", "picture", "provider"):
            if token_data.get(field) and getattr(user, field) != token_data[field]:
                setattr(user, field, token_data[field])
                changed = True
        if changed:
            db.commit()
            db.refresh(user)

    return user
