"""Decode a NextAuth HS256 JWT and return the user payload."""
from jose import JWTError, jwt
from fastapi import HTTPException, status

from config import settings

ALGORITHM = "HS256"


def decode_nextauth_token(token: str) -> dict:
    """
    Decode a NextAuth JWT signed with NEXTAUTH_SECRET.
    Returns a dict with keys: email, name, picture (sub).
    Raises HTTP 401 on any failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.nextauth_secret,
            algorithms=[ALGORITHM],
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing email claim",
        )

    return {
        "email": email,
        "name": payload.get("name"),
        "picture": payload.get("picture"),
        "provider": payload.get("provider", "unknown"),
    }
