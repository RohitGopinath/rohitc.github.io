from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from models import engine, Base, Session as DBSession, IPO, GMPPrice, MarketIndex
import uvicorn
import scraper
import datetime
from pydantic import BaseModel

# Initialize DB
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- TASKS ---
def update_market_indices():
    # In a real app, scrape Yahoo Finance or similar
    # For now, we mock or use existing logic if any
    pass

scheduler = BackgroundScheduler()
scheduler.add_job(scraper.scrape_ipowatch, 'interval', hours=1)
scheduler.start()

# --- ROUTES ---

@app.get("/")
def read_root():
    return {"status": "ok", "service": "IPO Tracker Pro API"}

@app.get("/ipos")
def get_ipos():
    session = DBSession()
    try:
        # Get all IPOs
        ipos = session.query(IPO).all()
        result = []
        for ipo in ipos:
            # Get latest GMP
            latest_gmp = session.query(GMPPrice).filter(GMPPrice.ipo_id == ipo.id).order_by(GMPPrice.updated_at.desc()).first()
            gmp_val = latest_gmp.price if latest_gmp else 0.0

            # Trend (last 7 days)
            trend_data = []
            prices = session.query(GMPPrice).filter(GMPPrice.ipo_id == ipo.id).order_by(GMPPrice.updated_at.asc()).limit(20).all()
            for p in prices:
                trend_data.append({"price": p.price, "date": p.updated_at.strftime("%Y-%m-%d")})

            # Calculate growth
            base_price = 0.0
            try:
                # Clean price band to get base price (e.g., "100-120" -> 120, "100" -> 100)
                if ipo.price_band:
                    parts = ipo.price_band.split("-")
                    base_price = float(parts[-1].strip().replace("₹", "").replace(",", ""))
            except:
                pass

            growth_pct = 0.0
            if base_price > 0:
                growth_pct = round((gmp_val / base_price) * 100, 2)

            result.append({
                "id": ipo.id,
                "name": ipo.name,
                "symbol": ipo.symbol,
                "ipo_type": ipo.ipo_type,
                "gmp": gmp_val,
                "growth_percent": growth_pct,
                "listing_date": ipo.listing_date,
                "base_price": base_price,
                "status": ipo.status,
                "price_band": ipo.price_band,
                "type": ipo.ipo_type,
                "trend": trend_data
            })
        return result
    finally:
        session.close()

@app.get("/market-indices")
def get_indices():
    # Mock data for now as we focus on IPOs
    return [
        {"name": "NIFTY 50", "price": 22123.45, "percent": 0.34, "is_positive": True},
        {"name": "SENSEX", "price": 72987.12, "percent": -0.12, "is_positive": False},
        {"name": "BANK NIFTY", "price": 46500.00, "percent": 0.8, "is_positive": True},
        {"name": "INDIA VIX", "price": 15.2, "percent": -2.1, "is_positive": False}
    ]

# --- PREDICTION ENDPOINTS ---

class ProfitRequest(BaseModel):
    ipo_id: int
    lots: int

@app.post("/predict/profit")
def predict_profit(req: ProfitRequest):
    session = DBSession()
    try:
        ipo = session.query(IPO).filter(IPO.id == req.ipo_id).first()
        if not ipo:
            raise HTTPException(status_code=404, detail="IPO not found")

        # Get latest GMP
        latest_gmp = session.query(GMPPrice).filter(GMPPrice.ipo_id == ipo.id).order_by(GMPPrice.updated_at.desc()).first()
        gmp_val = latest_gmp.price if latest_gmp else 0.0

        # Try to determine lot size
        # If scraper didn't get it (it's 0), we use a default or try to guess from description if available
        # For now, we'll assume a standard Mainboard lot size of roughly ₹15,000 worth of shares if price is known, or just 1 share if unknown
        lot_size = ipo.lot_size

        # Heuristic for lot size if 0
        base_price = 0.0
        try:
             if ipo.price_band:
                parts = ipo.price_band.split("-")
                base_price = float(parts[-1].strip().replace("₹", "").replace(",", ""))
        except:
             pass

        if lot_size == 0 and base_price > 0:
            # Standard IPO lot is ~15000 INR
            lot_size = int(15000 / base_price)
        elif lot_size == 0:
            lot_size = 1 # Fallback

        total_profit = gmp_val * lot_size * req.lots
        investment = base_price * lot_size * req.lots

        return {
            "ipo_name": ipo.name,
            "estimated_profit": total_profit,
            "investment_amount": investment,
            "gmp": gmp_val,
            "lot_size": lot_size,
            "lots": req.lots
        }
    finally:
        session.close()

class AllotmentRequest(BaseModel):
    ipo_id: int
    category: str # "RII", "HNI"
    lots_applied: int

@app.post("/predict/allotment")
def predict_allotment(req: AllotmentRequest):
    session = DBSession()
    try:
        ipo = session.query(IPO).filter(IPO.id == req.ipo_id).first()
        if not ipo:
            raise HTTPException(status_code=404, detail="IPO not found")

        # Simplified logic since we don't have real-time subscription data scraping yet
        # We will infer probability from GMP demand. High GMP -> High Oversubscription -> Low Chance

        latest_gmp = session.query(GMPPrice).filter(GMPPrice.ipo_id == ipo.id).order_by(GMPPrice.updated_at.desc()).first()
        gmp_val = latest_gmp.price if latest_gmp else 0.0

        base_price = 0.0
        try:
             if ipo.price_band:
                parts = ipo.price_band.split("-")
                base_price = float(parts[-1].strip().replace("₹", "").replace(",", ""))
        except:
             pass

        growth_pct = 0.0
        if base_price > 0:
            growth_pct = (gmp_val / base_price) * 100

        # Heuristic Probability
        probability = "High"
        details = "Low demand expected, allotment likely."

        if growth_pct > 50:
            probability = "Very Low"
            details = f"GMP is very high ({growth_pct:.1f}%). Oversubscription likely > 50x. Lottery basis."
        elif growth_pct > 20:
            probability = "Low"
             # 1 lot vs multiple lots logic for Retail (RII usually 1 lot max benefit in oversub)
            if req.category == "RII" and req.lots_applied > 1:
                 details = "High demand. Applying for >1 lot in Retail usually doesn't increase chance (1 lot lottery)."
            else:
                 details = "Moderate to High demand. Lottery basis likely."
        elif growth_pct < 5:
            probability = "High"
            details = "Low GMP suggests low subscription interest."

        return {
            "ipo_name": ipo.name,
            "probability": probability,
            "reasoning": details,
            "category": req.category
        }

    finally:
        session.close()

@app.on_event("startup")
def startup_event():
    # Trigger a scrape on startup in background
    pass

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
