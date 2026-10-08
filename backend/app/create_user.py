"""Create a login, or reset an existing user's password.

Usage (from backend/):  venv/bin/python -m app.create_user
"""
import getpass
import sys

from . import models
from .auth import hash_password
from .database import Base, SessionLocal, engine

MIN_PASSWORD_LENGTH = 12


def main() -> None:
    Base.metadata.create_all(bind=engine)
    email = input("Email: ").strip().lower()
    if "@" not in email:
        sys.exit("That doesn't look like an email address.")

    password = getpass.getpass("Password: ")
    if len(password) < MIN_PASSWORD_LENGTH:
        sys.exit(f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")
    if getpass.getpass("Confirm password: ") != password:
        sys.exit("Passwords don't match.")

    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user is None:
            db.add(models.User(email=email, password_hash=hash_password(password)))
            print(f"Created user {email}.")
        else:
            user.password_hash = hash_password(password)
            # Log out every existing session after a password reset.
            db.query(models.UserSession).filter(models.UserSession.user_id == user.id).delete()
            print(f"Reset password for {email}.")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    main()
