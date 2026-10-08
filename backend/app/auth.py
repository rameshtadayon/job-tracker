import hashlib
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Optional

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from . import models
from .database import get_db

SESSION_COOKIE = "jt_session"
SESSION_TTL = timedelta(days=30)

# Login throttling: at most MAX_FAILURES failed attempts per client IP per window.
MAX_FAILURES = 5
FAILURE_WINDOW_SECONDS = 15 * 60

_hasher = PasswordHasher()
# Verified against when the email is unknown, so response time doesn't reveal which emails exist.
_DUMMY_HASH = _hasher.hash(secrets.token_urlsafe(16))
_failures: "defaultdict[str, deque[float]]" = defaultdict(deque)


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _client_ip(request: Request) -> str:
    # Fly's edge sets Fly-Client-IP and clients can't spoof it. Requests proxied by Netlify
    # arrive from a few Netlify IPs, so the limit acts as a near-global cap on failed logins.
    return request.headers.get("fly-client-ip") or (request.client.host if request.client else "")


def _recent_failures(ip: str) -> deque:
    attempts = _failures[ip]
    cutoff = time.monotonic() - FAILURE_WINDOW_SECONDS
    while attempts and attempts[0] < cutoff:
        attempts.popleft()
    return attempts


def authenticate(request: Request, db: Session, email: str, password: str) -> models.User:
    ip = _client_ip(request)
    if len(_recent_failures(ip)) >= MAX_FAILURES:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    user = db.query(models.User).filter(models.User.email == email.strip().lower()).first()
    try:
        _hasher.verify(user.password_hash if user else _DUMMY_HASH, password)
        if user is None:
            raise VerifyMismatchError
    except (VerifyMismatchError, InvalidHashError):
        _failures[ip].append(time.monotonic())
        raise HTTPException(status_code=401, detail="Invalid email or password")

    _failures.pop(ip, None)
    if _hasher.check_needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
        db.commit()
    return user


def _cookie_secure(request: Request) -> bool:
    # Through the tunnel the browser is on HTTPS; plain-HTTP localhost dev needs a non-Secure cookie.
    return request.url.hostname not in ("localhost", "127.0.0.1")


def start_session(request: Request, response: Response, db: Session, user: models.User) -> None:
    token = secrets.token_urlsafe(32)
    db.add(
        models.UserSession(
            token_hash=_hash_token(token),
            user_id=user.id,
            expires_at=datetime.utcnow() + SESSION_TTL,
        )
    )
    db.query(models.UserSession).filter(models.UserSession.expires_at < datetime.utcnow()).delete()
    db.commit()
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=int(SESSION_TTL.total_seconds()),
        httponly=True,
        secure=_cookie_secure(request),
        samesite="lax",
        path="/",
    )


def end_session(request: Request, response: Response, db: Session) -> None:
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        db.query(models.UserSession).filter(
            models.UserSession.token_hash == _hash_token(token)
        ).delete()
        db.commit()
    response.delete_cookie(SESSION_COOKIE, path="/")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    token: Optional[str] = request.cookies.get(SESSION_COOKIE)
    if token:
        session = (
            db.query(models.UserSession)
            .filter(models.UserSession.token_hash == _hash_token(token))
            .first()
        )
        if session is not None and session.expires_at > datetime.utcnow():
            return session.user
    raise HTTPException(status_code=401, detail="Not authenticated")
