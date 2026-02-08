import re
import time
from datetime import datetime
from playwright.sync_api import sync_playwright
from sqlalchemy.orm import sessionmaker
from models import engine, Base, IPO, GMPPrice, Subscription

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

def parse_date(date_str):
    if not date_str:
        return None
    try:
        # Expected formats: "20 Feb", "Feb 20, 2024", "20-Feb-2024"
        current_year = datetime.now().year

        # If it's just "20 Feb", append year
        if re.match(r'\d{1,2}\s+[A-Za-z]{3}$', date_str.strip()):
            date_str = f"{date_str} {current_year}"
            return datetime.strptime(date_str, "%d %b %Y").strftime("%Y-%m-%d")

        # If it's "Feb 20, 2024"
        try:
            return datetime.strptime(date_str, "%b %d, %Y").strftime("%Y-%m-%d")
        except:
            pass

        return date_str # Return original if parse fails
    except:
        return date_str

def scrape_ipo_details(page, ipo_obj):
    """
    Scrapes the detail page for an IPO.
    Updates ipo_obj with timeline, financials, subscription.
    """
    print(f"  Scraping details for {ipo_obj.name}...")

    # 1. Timeline (Tentative Timetable)
    try:
        # Look for table containing "Open Date", "Close Date"
        # Strategy: Find all tables, check headers/first col
        tables = page.locator("table").all()

        for table in tables:
            text = table.inner_text().lower()

            # Timetable
            if "open date" in text and "close date" in text:
                rows = table.locator("tr").all()
                for row in rows:
                    cols = row.locator("td").all()
                    if len(cols) < 2: continue
                    label = cols[0].inner_text().lower()
                    val = cols[1].inner_text().strip()

                    if "open date" in label:
                        ipo_obj.open_date = val
                    elif "close date" in label:
                        ipo_obj.close_date = val
                    elif "allotment date" in label:
                        ipo_obj.allotment_date = val
                    elif "refunds" in label:
                        ipo_obj.refund_date = val
                    elif "listing date" in label:
                        ipo_obj.listing_date = val

            # Financials (IPO Details)
            if "face value" in text or "price band" in text:
                rows = table.locator("tr").all()
                for row in rows:
                    cols = row.locator("td").all()
                    if len(cols) < 2: continue
                    label = cols[0].inner_text().lower()
                    val = cols[1].inner_text().strip()

                    if "price band" in label:
                        ipo_obj.price_band = val
                    elif "lot size" in label:
                        try:
                            ipo_obj.lot_size = int(clean_currency(val))
                        except: pass
                    elif "total issue size" in label:
                        ipo_obj.issue_size = val
                    elif "fresh issue" in label:
                        ipo_obj.fresh_issue = val
                    elif "offer for sale" in label:
                        ipo_obj.offer_for_sale = val

            # Subscription (Subscription Status)
            if "qib" in text and "nii" in text:
                 # Clear old subscriptions
                 session.query(Subscription).filter(Subscription.ipo_id == ipo_obj.id).delete()

                 rows = table.locator("tr").all()
                 # Skip header
                 for row in rows[1:]:
                     cols = row.locator("td").all()
                     if len(cols) < 2: continue
                     cat = cols[0].inner_text().strip()
                     times = cols[1].inner_text().strip()

                     if not cat: continue

                     sub = Subscription(
                         ipo_id=ipo_obj.id,
                         category=cat,
                         times_subscribed=clean_currency(times)
                     )
                     session.add(sub)

        session.commit()
    except Exception as e:
        print(f"  Error scraping details: {e}")


def scrape_ipowatch():
    print("Starting Playwright scraper for ipowatch.in...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        page = context.new_page()

        try:
            url = "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/"
            print(f"Navigating to {url}...")
            page.goto(url, timeout=60000)

            page.wait_for_selector("table", timeout=20000)
            rows = page.locator("table tbody tr").all()
            print(f"Found {len(rows)} rows in main table.")

            processed_count = 0

            # Limit to top 10 for performance/MVP, or scrape all?
            # User wants a real app, let's scrape first 10-15 to be safe
            for i, row in enumerate(rows):
                if i > 15: break

                cells = row.locator("td").all()
                if len(cells) < 5: continue

                texts = [c.inner_text().strip() for c in cells]
                if "Stock" in texts[0] or "IPO" in texts[0]: continue

                ipo_name = texts[0]
                gmp_str = texts[1]
                price_str = texts[2]
                ipo_type = texts[5] if len(texts) > 5 else "Mainboard"

                # Extract Detail Link
                link_el = cells[0].locator("a").first
                detail_url = None
                if link_el.count() > 0:
                    detail_url = link_el.get_attribute("href")

                # Normalize Type
                normalized_type = "SME" if "SME" in ipo_type else "Mainboard"

                # Create/Update IPO
                existing = session.query(IPO).filter(IPO.name == ipo_name).first()
                if not existing:
                    new_ipo = IPO(
                        name=ipo_name,
                        ipo_type=normalized_type,
                        price_band=price_str,
                        status="Upcoming" # Default, will refine
                    )
                    session.add(new_ipo)
                    session.commit()
                    session.refresh(new_ipo)
                    ipo_obj = new_ipo
                else:
                    existing.price_band = price_str
                    session.commit()
                    ipo_obj = existing

                # Add GMP
                gmp_val = clean_currency(gmp_str)
                # Avoid duplicate GMP entries for same day/time?
                # For now, just add. We can clean up later or take latest.
                new_gmp = GMPPrice(ipo_id=ipo_obj.id, price=gmp_val)
                session.add(new_gmp)
                session.commit()

                # Scrape Details if URL exists
                if detail_url:
                    try:
                        detail_page = context.new_page()
                        detail_page.goto(detail_url, timeout=30000)
                        scrape_ipo_details(detail_page, ipo_obj)
                        detail_page.close()
                    except Exception as e:
                        print(f"  Failed to load detail page {detail_url}: {e}")

                processed_count += 1

            print(f"Scraping complete. Processed {processed_count} IPOs.")

        except Exception as e:
            print(f"Scraper Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    scrape_ipowatch()
