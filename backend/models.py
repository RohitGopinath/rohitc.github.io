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

    # Financials
    price_band = Column(String, nullable=True) # e.g. "100 - 120"
    lot_size = Column(Integer, nullable=True)
    issue_size = Column(String, nullable=True) # e.g. "500 Cr"
    fresh_issue = Column(String, nullable=True)
    offer_for_sale = Column(String, nullable=True)

    # Timeline (Dates as YYYY-MM-DD string)
    open_date = Column(String, nullable=True)
    close_date = Column(String, nullable=True)
    allotment_date = Column(String, nullable=True)
    refund_date = Column(String, nullable=True)
    listing_date = Column(String, nullable=True)

    # Status
    status = Column(String, default="Upcoming") # Upcoming, Open, Closed, Listed

    # Relationships
    gmp_prices = relationship("GMPPrice", back_populates="ipo", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="ipo", cascade="all, delete-orphan")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    ipo_id = Column(Integer, ForeignKey("ipos.id"))
    category = Column(String) # QIB, NII, RII, Total
    times_subscribed = Column(Float, default=0.0)
    shares_bid = Column(String, nullable=True) # Optional: number of shares bid
    updated_at = Column(DateTime, default=datetime.utcnow)

    ipo = relationship("IPO", back_populates="subscriptions")

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
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "ipo_tracker.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
