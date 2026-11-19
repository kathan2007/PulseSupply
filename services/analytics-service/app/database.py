import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

# Convert asyncpg or pool prefix if standard driver is needed
db_url = settings.database_url
if db_url.startswith("postgresql+asyncpg://"):
    sync_db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
else:
    sync_db_url = db_url

try:
    engine = create_engine(
        sync_db_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
except Exception as e:
    logger.warning(f"Could not initialize PostgreSQL engine immediately: {e}")
    engine = None
    SessionLocal = None

Base = declarative_base()


def get_db():
    if SessionLocal is None:
        yield None
        return
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

