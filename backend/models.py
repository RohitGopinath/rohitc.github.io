from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import os

Base = declarative_base()

class IPO(Base):
    __tablename__ = "ipos"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    symbol = Column(String, nullable=True)  # NSE/BSE Symbol
    ipo_type = Column(String)  # 'Mainboard' or 'SME'

    # Dates
    open_date = Column(String, nullable=True)
    close_date = Column(String, nullable=True)
    listing_date = Column(String, nullable=True)

    # Financials
    price_band = Column(String, nullable=True)
    lot_size = Column(Integer, nullable=True)
    issue_size = Column(String, nullable=True)

    # Status
    status = Column(String, default="Upcoming") # Upcoming, Open, Closed

    # Relationships
    gmp_prices = relationship("GMPPrice", back_populates="ipo", cascade="all, delete-orphan")

class GMPPrice(Base):
    __tablename__ = "gmp_prices"

    id = Column(Integer, primary_key=True, index=True)
    ipo_id = Column(Integer, ForeignKey("ipos.id"))
    price = Column(Float) # The GMP value
    updated_at = Column(DateTime, default=datetime.utcnow)

    ipo = relationship("IPO", back_populates="gmp_prices")

class MarketIndex(Base):
    __tablename__ = "market_indices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True) # NIFTY 50, SENSEX
    current_price = Column(Float)
    change_percent = Column(Float)
    last_updated = Column(DateTime, default=datetime.utcnow)

# Database Setup
# Use environment variable for DB connection, default to SQLite
# If running from backend directory, path should be ./ipo_tracker.db
# If running from root, path should be ./backend/ipo_tracker.db
# We can use absolute path to be safe
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "ipo_tracker.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

# Fix for Render/Supabase which might provide 'postgres://' but SQLAlchemy needs 'postgresql://'
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
