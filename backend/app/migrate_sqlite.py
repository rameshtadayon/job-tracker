"""Copy applications and contacts from the old SQLite file into DATABASE_URL (Neon Postgres).

The SQLite file is opened read-only and is never modified. Rows keep their ids and timestamps.
Copied applications stay unclaimed (user_id NULL, invisible in the app) unless --owner-email
names an existing user; claim them later with `python -m app.claim_data <email>`.

Usage (from backend/):
  DATABASE_URL='postgresql://...' venv/bin/python -m app.migrate_sqlite job_tracker.db \
      [--owner-email you@example.com]
"""
import argparse
import os
import sys
from pathlib import Path

from sqlalchemy import create_engine, func, inspect, select, text

from . import models
from .database import Base, engine as target

TABLES = [models.Application.__table__, models.Contact.__table__]


def read_rows(conn, table, columns):
    return [dict(r._mapping) for r in conn.execute(select(*columns).order_by(table.c.id))]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("sqlite_path")
    parser.add_argument("--owner-email")
    args = parser.parse_args()

    if "DATABASE_URL" not in os.environ:
        sys.exit("Set DATABASE_URL to the target database (your Neon connection string).")
    path = Path(args.sqlite_path).resolve()
    if not path.is_file():
        sys.exit(f"No such file: {path}")
    source = create_engine(f"sqlite:///file:{path}?mode=ro&uri=true")

    Base.metadata.create_all(bind=target)

    with target.connect() as conn:
        for table in TABLES:
            existing = conn.execute(select(func.count()).select_from(table)).scalar_one()
            if existing:
                sys.exit(f"Target already has {existing} rows in {table.name}; refusing to copy.")
        owner_id = None
        if args.owner_email:
            email = args.owner_email.strip().lower()
            owner_id = conn.execute(
                select(models.User.id).where(models.User.email == email)
            ).scalar_one_or_none()
            if owner_id is None:
                sys.exit(f"No user {email} in the target. Run app.create_user first, or omit it.")

    source_inspector = inspect(source)
    with source.connect() as src, target.begin() as dst:
        for table in TABLES:
            source_columns = {c["name"] for c in source_inspector.get_columns(table.name)}
            missing = source_columns - set(table.c.keys())
            if missing:
                sys.exit(f"{table.name} has columns the new schema lacks: {sorted(missing)}")
            columns = [c for c in table.c if c.name in source_columns]

            rows = read_rows(src, table, columns)
            if table is models.Application.__table__:
                for row in rows:
                    row["user_id"] = owner_id
            if rows:
                dst.execute(table.insert(), rows)

            # Raising here rolls back the whole transaction, so the target is left empty.
            if read_rows(dst, table, columns) != read_rows(src, table, columns):
                raise RuntimeError(f"Verification failed for {table.name}; nothing was copied.")
            print(f"Copied and verified {len(rows)} {table.name}.")

            if dst.dialect.name == "postgresql" and rows:
                # Explicit ids bypass the serial sequence; move it past them for new inserts.
                dst.execute(
                    text(
                        f"SELECT setval(pg_get_serial_sequence('{table.name}', 'id'), "
                        f"(SELECT MAX(id) FROM {table.name}))"
                    )
                )

    if owner_id is None:
        print("Applications are unclaimed. Run `python -m app.claim_data <email>` to claim them.")
    else:
        print(f"Applications are owned by {args.owner_email}.")


if __name__ == "__main__":
    main()
