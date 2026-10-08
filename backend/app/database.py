import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Production sets DATABASE_URL to the Neon Postgres URL. Local dev falls back to a scratch
# SQLite file; job_tracker.db is the pre-Postgres archive and is only read by migrate_sqlite.
SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./dev.db")

# On Fly (which sets FLY_APP_NAME) a missing secret would silently write to a throwaway file.
if os.environ.get("FLY_APP_NAME") and "DATABASE_URL" not in os.environ:
    raise RuntimeError("DATABASE_URL is not set; run `fly secrets import < .env`.")


def normalize_url(url: str) -> str:
    # Neon hands out postgres:// / postgresql:// URLs; SQLAlchemy needs the psycopg 3 driver named.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix):]
    return url


def make_engine(url: str):
    url = normalize_url(url)
    if url.startswith("sqlite"):
        return create_engine(url, connect_args={"check_same_thread": False})
    # Neon suspends idle compute and drops connections; pre_ping replaces dead ones transparently.
    return create_engine(url, pool_pre_ping=True, pool_recycle=300)


engine = make_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
