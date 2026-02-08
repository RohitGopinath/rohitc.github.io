import re
from datetime import datetime
from playwright.sync_api import sync_playwright
from sqlalchemy.orm import sessionmaker
from models import engine, Base, IPO, GMPPrice

# Init DB
Base.metadata.create_all(bind=engine)
Session = sessionmaker(bind=engine)
session = Session()

def clean_currency(value):
    if not value:
        return 0.0
    # Remove ₹, comma, % and whitespace
    clean = re.sub(r'[^\d.-]', '', str(value))
    try:
        return float(clean)
    except ValueError:
        return 0.0

def parse_ipo_date(date_str):
    """
    Parses dates like "20-22 Feb" or "20 Feb" into (open_date, close_date)
    Returns (YYYY-MM-DD, YYYY-MM-DD) or (None, None)
    """
    if not date_str or date_str.strip() == "":
        return None, None

    current_year = datetime.now().year

    try:
        # Case: "20-22 Feb"
        if "-" in date_str:
            parts = date_str.split("-")
            if len(parts) == 2:
                start_part = parts[0].strip() # "20"
                end_full = parts[1].strip()   # "22 Feb"

                # Extract month from end_full
                month_str = end_full.split(" ")[-1]

                start_dt_str = f"{start_part} {month_str} {current_year}"
                end_dt_str = f"{end_full} {current_year}"

                start_dt = datetime.strptime(start_dt_str, "%d %b %Y")
                end_dt = datetime.strptime(end_dt_str, "%d %b %Y")

                return start_dt.strftime("%Y-%m-%d"), end_dt.strftime("%Y-%m-%d")

        # Case: "20 Feb" (Single date, maybe listing or just open)
        else:
             dt = datetime.strptime(f"{date_str} {current_year}", "%d %b %Y")
             return dt.strftime("%Y-%m-%d"), dt.strftime("%Y-%m-%d")

    except Exception as e:
        print(f"Date parse error for '{date_str}': {e}")
        return None, None

    return None, None

def scrape_ipowatch():
    print("Starting Playwright scraper for ipowatch.in...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            url = "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/"
            print(f"Navigating to {url}...")
            page.goto(url, timeout=60000)

            # Wait for table
            page.wait_for_selector("table", timeout=20000)

            # Find the main data table
            rows = page.locator("table tbody tr").all()
            print(f"Found {len(rows)} rows.")

            count_added = 0

            for row in rows:
                cells = row.locator("td").all()
                if len(cells) < 5:
                    continue

                texts = [c.inner_text().strip() for c in cells]

                # Headers check
                if "Stock" in texts[0] or "IPO" in texts[0]:
                    continue

                # Mapping based on observation:
                # 0: Name (e.g., "Fractal Analytics")
                # 1: GMP (e.g., "₹42")
                # 2: IPO Price (e.g., "₹900")
                # 3: Gain (e.g., "4.66%") - Skip
                # 4: Date (e.g., "9-11 Feb")
                # 5: Type (e.g., "Mainboard" or "SME")

                ipo_name = texts[0]
                gmp_str = texts[1]
                price_str = texts[2]
                # gain_str = texts[3]
                date_str = texts[4]
                ipo_type_raw = texts[5] if len(texts) > 5 else "Mainboard"

                # Parse Dates
                open_date, close_date = parse_ipo_date(date_str)

                # Determine Status
                # Logic:
                # If no GMP ("--" or "-"), maybe Closed or Upcoming (inactive).
                # If dates are in future -> Upcoming
                # If dates are current -> Open
                # If dates are past -> Closed

                status = "Upcoming"
                if open_date and close_date:
                    today = datetime.now().strftime("%Y-%m-%d")
                    if today >= open_date and today <= close_date:
                        status = "Open"
                    elif today > close_date:
                        status = "Closed"
                    else:
                        status = "Upcoming"
                elif gmp_str in ["--", "-"]:
                     # Fallback if no dates but inactive GMP
                     status = "Upcoming"

                # Parse Values
                gmp_value = clean_currency(gmp_str)
                base_price = clean_currency(price_str)

                # Growth Percent Calculation
                growth_percent = 0.0
                if base_price > 0:
                    growth_percent = round((gmp_value / base_price) * 100, 2)

                # Normalize Type
                if "SME" in ipo_type_raw:
                    normalized_type = "SME"
                else:
                    normalized_type = "Mainboard"

                # Update DB
                existing = session.query(IPO).filter(IPO.name == ipo_name).first()

                if not existing:
                    new_ipo = IPO(
                        name=ipo_name,
                        ipo_type=normalized_type,
                        price_band=price_str,
                        status=status,
                        open_date=open_date,
                        close_date=close_date,
                        lot_size=0 # Default, will need detail scrape for this
                    )
                    session.add(new_ipo)
                    session.commit()
                    session.refresh(new_ipo)
                    ipo_id = new_ipo.id
                else:
                    ipo_id = existing.id
                    existing.price_band = price_str
                    existing.open_date = open_date
                    existing.close_date = close_date
                    existing.status = status # Update status dynamically
                    existing.ipo_type = normalized_type
                    session.commit()

                # Add GMP Entry
                new_gmp = GMPPrice(
                    ipo_id=ipo_id,
                    price=gmp_value,
                    updated_at=datetime.utcnow()
                )
                session.add(new_gmp)
                count_added += 1

            session.commit()
            print(f"Scraping complete. Processed {count_added} records.")

        except Exception as e:
            print(f"Scraper Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    scrape_ipowatch()
