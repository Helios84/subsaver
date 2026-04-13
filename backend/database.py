from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from config import settings

DATABASE_URL = settings.database_url

# Build engine kwargs — SQLite needs check_same_thread=False,
# PostgreSQL works better with pool_pre_ping for Neon (which closes idle connections).
_is_sqlite = DATABASE_URL.startswith("sqlite")

engine_kwargs: dict = {}
if _is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True   # Neon closes idle conns; ping before use
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 10

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
