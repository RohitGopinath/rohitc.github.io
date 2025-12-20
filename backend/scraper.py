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
            # Usually the first table on this page
            rows = page.locator("table tbody tr").all()
            print(f"Found {len(rows)} rows.")

            count_added = 0

            for row in rows:
                cells = row.locator("td").all()
                if len(cells) < 5:
                    continue

                texts = [c.inner_text().strip() for c in cells]

                # IPOWatch Headers: Stock / IPO | GMP | Price | Gain | Date | Type
                # Note: First row might be header
                if "Stock" in texts[0] or "IPO" in texts[0]:
                    continue

                ipo_name = texts[0]
                gmp_str = texts[1]
                price_str = texts[2]
                date_str = texts[4] # e.g. "20-Feb" or "20-22 Feb"
                ipo_type = texts[5] if len(texts) > 5 else "Mainboard"

                # Parse Dates
                open_date = None
                close_date = None
                try:
                    current_year = datetime.now().year
                    if "-" in date_str:
                        parts = date_str.split("-")
                        if len(parts) == 2:
                            # E.g. "20-22 Feb"
                            start_day = parts[0].strip()
                            end_part = parts[1].strip() # "22 Feb"

                            # Parse end part
                            end_dt = datetime.strptime(f"{end_part} {current_year}", "%d %b %Y")
                            close_date = end_dt.strftime("%Y-%m-%d")

                            # Parse start part (needs month from end_part if missing)
                            month_str = end_part.split(" ")[-1]
                            start_dt = datetime.strptime(f"{start_day} {month_str} {current_year}", "%d %b %Y")
                            open_date = start_dt.strftime("%Y-%m-%d")

                    else:
                         # Single date or unknown
                         pass
                except Exception:
                    # Keep as string or null if parsing fails
                    open_date = date_str
                    close_date = date_str

                # Determine status based on name or GMP presence
                # If GMP is "--", it might be inactive
                status = "Upcoming"
                if gmp_str == "--" or gmp_str == "-":
                    # Maybe closed or too early
                    pass

                # Try to parse GMP
                gmp_value = clean_currency(gmp_str)

                # Normalize Type
                if "SME" in ipo_type:
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
                        lot_size=0
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
