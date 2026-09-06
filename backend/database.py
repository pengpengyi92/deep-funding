import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

ROOT = Path(__file__).resolve().parents[1]


def database_url():
    return os.environ.get("DEEP_FUNDING_DATABASE_URL", f"sqlite:///{ROOT / 'data' / 'deep_funding.db'}")


def make_database(url=None):
    url = url or database_url()
    parsed = make_url(url)
    if parsed.drivername.startswith("sqlite"):
        if parsed.database and parsed.database != ":memory:":
            Path(parsed.database).resolve().parent.mkdir(parents=True, exist_ok=True)
        engine = create_engine(url, connect_args={"check_same_thread": False, "timeout": 15})

        @event.listens_for(engine, "connect")
        def pragmas(connection, _):
            connection.execute("PRAGMA foreign_keys=ON")
            connection.execute("PRAGMA busy_timeout=15000")
    else:
        engine = create_engine(url, pool_pre_ping=True)
    return engine, sessionmaker(engine, expire_on_commit=False)


def initialize(engine):
    from .models import Base
    Base.metadata.create_all(engine)
