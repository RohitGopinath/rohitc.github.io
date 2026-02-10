from models import Session, engine, Base, IPO, GMPPrice
import datetime
import random

Base.metadata.create_all(bind=engine)
session = Session()

# Create dummy IPOs
ipos = [
    IPO(
        name="Tata Technologies",
        symbol="TATA",
        ipo_type="Mainboard",
        listing_date="2025-03-01",
        status="Open",
        price_band="475-500",
        lot_size=30,
        kostak_rate=150,
        retail_subscription_x=45.5,
        allotment_url="https://linkintime.co.in",
        sentiment_bullish=120,
        sentiment_bearish=30
    ),
    IPO(
        name="Plaza Wires",
        symbol="PLAZA",
        ipo_type="SME",
        listing_date="2025-03-05",
        status="Upcoming",
        price_band="51-54",
        lot_size=2000,
        kostak_rate=0,
        retail_subscription_x=2.5,
        sentiment_bullish=10,
        sentiment_bearish=50
    ),
    IPO(
        name="Valiant Labs",
        symbol="VALIANT",
        ipo_type="Mainboard",
        listing_date="2025-02-28",
        status="Closed",
        price_band="133-140",
        lot_size=105,
        kostak_rate=20,
        retail_subscription_x=12.0,
        sentiment_bullish=200,
        sentiment_bearish=150
    )
]

session.add_all(ipos)
session.commit()

# Add GMP Prices (Sparkline Data)
for ipo in ipos:
    # Add trend data (last 5-7 days)
    base = 250 if ipo.symbol == "TATA" else (30 if ipo.symbol == "PLAZA" else 15)
    for i in range(7):
        # Create a trend: Up, Down, or Flat
        if ipo.symbol == "TATA":
            change = random.randint(0, 5) # Up trend
        elif ipo.symbol == "PLAZA":
             change = random.randint(-2, 2) # Flat
        else:
            change = random.randint(-5, 0) # Down trend

        price = base + (change * i)

        # Ensure updated_at is sequential
        date = datetime.datetime.now() - datetime.timedelta(days=6-i)

        gmp = GMPPrice(ipo_id=ipo.id, price=price, updated_at=date)
        session.add(gmp)

session.commit()
print("Seeded dense data successfully.")
session.close()
