"""Assign every unclaimed application (and its contacts) to a user.

Usage (from backend/):  venv/bin/python -m app.claim_data you@example.com
"""
import sys

from . import models
from .database import SessionLocal


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    email = sys.argv[1].strip().lower()

    db = SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user is None:
            sys.exit(f"No user {email}. Create it first with `python -m app.create_user`.")
        unclaimed = db.query(models.Application).filter(models.Application.user_id.is_(None))
        count = unclaimed.count()
        if count == 0:
            print("No unclaimed applications.")
            return
        if input(f"Assign {count} unclaimed applications to {email}? [y/N] ").lower() != "y":
            print("Cancelled.")
            return
        unclaimed.update({models.Application.user_id: user.id}, synchronize_session=False)
        db.commit()
        print(f"Assigned {count} applications to {email}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
