from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, sessionmaker
from contextlib import asynccontextmanager
from apscheduler.schedulers.background import BackgroundScheduler
from models import engine, Base, IPO, GMPPrice, MarketIndex
from scraper import scrape_ipowatch
import yfinance as yf
from datetime import datetime, timedelta

# Scheduler Setup
scheduler = BackgroundScheduler()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schedule scraping every 4 hours
    scheduler.add_job(scrape_ipowatch, 'interval', hours=4)
    # Schedule an immediate scrape shortly after startup (10 seconds delay)
    scheduler.add_job(scrape_ipowatch, 'date', run_date=datetime.now() + timedelta(seconds=10))
    scheduler.start()
    print("Scheduler started: Scraper will run every 4 hours and once on startup.")
    yield
    scheduler.shutdown()
    print("Scheduler shut down.")

# Database Dependency
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="IPO Tracker Pro API", lifespan=lifespan)

# CORS Setup (Allow Frontend Access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set to specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to IPO Tracker Pro API"}

@app.get("/ipos")
def get_ipos(db: Session = Depends(get_db)):
    """Fetch all IPOs with their latest GMP."""
    ipos = db.query(IPO).all()
    results = []
    for ipo in ipos:
        latest_gmp = 0
        if ipo.gmp_prices:
            latest_gmp = ipo.gmp_prices[-1].price

        results.append({
            "id": ipo.id,
            "name": ipo.name,
            "type": ipo.ipo_type,
            "price_band": ipo.price_band,
            "status": ipo.status,
            "gmp": latest_gmp,
            "open_date": ipo.open_date,
            "close_date": ipo.close_date
        })
    return results

@app.get("/ipos/{ipo_id}")
def get_ipo_details(ipo_id: int, db: Session = Depends(get_db)):
    """Fetch detailed info for a specific IPO."""
    ipo = db.query(IPO).filter(IPO.id == ipo_id).first()
    if not ipo:
        raise HTTPException(status_code=404, detail="IPO not found")

    gmp_history = [{"price": g.price, "date": g.updated_at} for g in ipo.gmp_prices]

    return {
        "id": ipo.id,
        "name": ipo.name,
        "symbol": ipo.symbol,
        "type": ipo.ipo_type,
        "price_band": ipo.price_band,
        "lot_size": ipo.lot_size,
        "status": ipo.status,
        "gmp_history": gmp_history,
        "open_date": ipo.open_date,
        "close_date": ipo.close_date
    }

@app.get("/news")
def get_market_news():
    """Fetch latest market news using yfinance."""
    try:
        # Fetch news for Nifty 50 to get general Indian market news
        ticker = yf.Ticker("^NSEI")
        news_items = ticker.news

        formatted_news = []
        for item in news_items:
            # Extract relevant fields
            content = item.get('content', {})
            if not content:
                continue

            formatted_news.append({
                "id": content.get('id'),
                "title": content.get('title'),
                "summary": content.get('summary', ''),
                "published_at": content.get('pubDate'),
                "link": content.get('clickThroughUrl', {}).get('url'),
                "source": content.get('provider', {}).get('displayName', 'Yahoo Finance')
            })

        return formatted_news[:6] # Return top 6
    except Exception as e:
        print(f"Error fetching news: {e}")
        # Return empty list rather than error to allow UI to handle gracefully
        return []

@app.get("/market-indices")
def get_market_indices():
    """Fetch live/delayed NIFTY and SENSEX data using yfinance."""
    try:
        tickers = {"^NSEI": "NIFTY 50", "^BSESN": "SENSEX"}
        data = []

        for symbol, name in tickers.items():
            ticker = yf.Ticker(symbol)
            # Fast fetch
            info = ticker.history(period="1d")
            if not info.empty:
                current_price = info['Close'].iloc[-1]
                open_price = info['Open'].iloc[-1]
                change = current_price - open_price
                change_percent = (change / open_price) * 100

                data.append({
                    "name": name,
                    "price": float(round(current_price, 2)),
                    "change": float(round(change, 2)),
                    "percent": float(round(change_percent, 2)),
                    "is_positive": bool(change >= 0)
                })
        return data
    except Exception as e:
        print(f"Error fetching market data: {e}")
        # Strict Real Data: Return empty list or error, never mock data.
        raise HTTPException(status_code=503, detail="Market data unavailable")
