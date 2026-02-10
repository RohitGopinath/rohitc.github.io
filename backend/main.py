from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from models import engine, Base, Session as DBSession, IPO, GMPPrice, MarketIndex
import uvicorn
import datetime
from pydantic import BaseModel

# Import Merger Service
from services.ipo_merger import IPOMergerService
from services.market_data import update_market_data

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
def scrape_job():
    print("Running scheduled scrape...")
    session = DBSession()
    try:
        service = IPOMergerService(session)
        service.scrape_and_merge()
    except Exception as e:
        print(f"Scrape Job Failed: {e}")
    finally:
        session.close()

def market_data_job():
    print("Running market data update...")
    session = DBSession()
    try:
        update_market_data(session)
    except Exception as e:
        print(f"Market Data Update Failed: {e}")
    finally:
        session.close()

scheduler = BackgroundScheduler()
# Schedule every hour
scheduler.add_job(scrape_job, 'interval', hours=1)
scheduler.add_job(market_data_job, 'interval', hours=1)
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
                "trend": trend_data,
                "lot_size": ipo.lot_size,
                "kostak_rate": ipo.kostak_rate,
                "retail_subscription_x": ipo.retail_subscription_x,
                "allotment_url": ipo.allotment_url,
                "sentiment_bullish": ipo.sentiment_bullish,
                "sentiment_bearish": ipo.sentiment_bearish
            })
        return result
    finally:
        session.close()

@app.get("/market-indices")
def get_indices():
    session = DBSession()
    try:
        indices = session.query(MarketIndex).all()
        if not indices:
             # Fallback to mock if empty (or return empty list)
             return []

        result = []
        # Sort so NIFTY 50 and SENSEX are first
        def sort_key(x):
            if x.name == "NIFTY 50": return 0
            if x.name == "SENSEX": return 1
            return 2

        sorted_indices = sorted(indices, key=sort_key)

        for idx in sorted_indices:
            result.append({
                "name": idx.name,
                "price": idx.current_price,
                "percent": idx.change_percent,
                "is_positive": idx.change_percent >= 0
            })
        return result
    finally:
        session.close()

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

class VoteRequest(BaseModel):
    vote_type: str # "bullish" | "bearish"

@app.post("/ipos/{ipo_id}/vote")
def vote_sentiment(ipo_id: int, req: VoteRequest):
    session = DBSession()
    try:
        ipo = session.query(IPO).filter(IPO.id == ipo_id).first()
        if not ipo:
            raise HTTPException(status_code=404, detail="IPO not found")

        if req.vote_type == "bullish":
            ipo.sentiment_bullish += 1
        elif req.vote_type == "bearish":
            ipo.sentiment_bearish += 1
        else:
            raise HTTPException(status_code=400, detail="Invalid vote type")

        session.commit()
        return {
            "status": "success",
            "bullish": ipo.sentiment_bullish,
            "bearish": ipo.sentiment_bearish
        }
    finally:
        session.close()

@app.post("/predict/allotment")
def predict_allotment(req: AllotmentRequest):
    session = DBSession()
    try:
        ipo = session.query(IPO).filter(IPO.id == req.ipo_id).first()
        if not ipo:
            raise HTTPException(status_code=404, detail="IPO not found")

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
    # Trigger a scrape shortly after startup
    scheduler.add_job(scrape_job, 'date', run_date=datetime.datetime.now() + datetime.timedelta(seconds=5))
    scheduler.add_job(market_data_job, 'date', run_date=datetime.datetime.now() + datetime.timedelta(seconds=10))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
