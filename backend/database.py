import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Fetch the URL from environment variables, or fallback to SQLite for local testing
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./auction_league.db" 
)

# Fix for older SQLAlchemy versions if the URL starts with 'postgres://' instead of 'postgresql://'
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite needs 'check_same_thread', but PostgreSQL does not.
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()