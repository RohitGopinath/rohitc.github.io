import sys
import os

# Ensure backend directory is in python path if run from root
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import engine, Base, IPO, GMPPrice, MarketIndex

def init_db():
    print(f"Initializing database with engine: {engine.url}")
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_db()
