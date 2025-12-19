from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, sessionmaker
from models import engine, Base, IPO, GMPPrice, MarketIndex
import yfinance as yf
from datetime import datetime, timedelta

# Database Dependency
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="IPO Tracker Pro API")

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
        # Fallback dummy data if yfinance fails (e.g. no internet or rate limit)
        return [
            {"name": "NIFTY 50", "price": 22000.50, "change": 120.50, "percent": 0.55, "is_positive": True},
            {"name": "SENSEX", "price": 72500.20, "change": -150.10, "percent": -0.21, "is_positive": False}
        ]
