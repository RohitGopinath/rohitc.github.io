import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import sessionmaker
from models import engine, Base, IPO, GMPPrice
from datetime import datetime
import re
import random

# Init DB
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)
session = Session()

def seed_dummy_data():
    print("Seeding dummy data...")
    dummy_ipos = [
        {"name": "Tata Technologies", "price": "500", "gmp": 400, "type": "Mainboard", "status": "Closed"},
        {"name": "Mamaearth (Honasa)", "price": "324", "gmp": 30, "type": "Mainboard", "status": "Closed"},
        {"name": "Ola Electric", "price": "76", "gmp": 12, "type": "Mainboard", "status": "Upcoming"},
        {"name": "Swiggy", "price": "350", "gmp": 80, "type": "Mainboard", "status": "Upcoming"},
        {"name": "FirstCry", "price": "450", "gmp": 100, "type": "Mainboard", "status": "Open"},
        {"name": "Australian Premium Solar", "price": "140", "gmp": 50, "type": "SME", "status": "Open"},
        {"name": "DelaPlex Ltd", "price": "192", "gmp": 150, "type": "SME", "status": "Upcoming"},
    ]

    for data in dummy_ipos:
        existing = session.query(IPO).filter(IPO.name == data["name"]).first()
        if not existing:
            new_ipo = IPO(
                name=data["name"],
                ipo_type=data["type"],
                price_band=f"₹{data['price']}",
                status=data["status"],
                open_date="2024-02-10",
                close_date="2024-02-13",
                lot_size=50 if data["type"] == "Mainboard" else 1000
            )
            session.add(new_ipo)
            session.commit()

            # Add GMP history
            gmp_val = data["gmp"]
            new_gmp = GMPPrice(
                ipo_id=new_ipo.id,
                price=gmp_val,
                updated_at=datetime.utcnow()
            )
            session.add(new_gmp)

    session.commit()
    print("Dummy data seeded.")

def scrape_investorgain():
    print("Starting scraper...")
    # Attempt scraping (mock implementation for now given robots.txt blocks)
    # If scraping yields no results, we seed.

    # Check if DB is empty
    count = session.query(IPO).count()
    if count == 0:
        seed_dummy_data()
    else:
        print(f"Database already has {count} records.")

if __name__ == "__main__":
    scrape_investorgain()
