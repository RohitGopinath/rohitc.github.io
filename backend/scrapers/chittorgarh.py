from typing import List
from playwright.sync_api import sync_playwright
from datetime import datetime
from .base import BaseScraper, ScrapedIPOData
from .utils import parse_ipo_date, clean_currency
import fake_useragent

class ChittorgarhScraper(BaseScraper):
    def scrape(self) -> List[ScrapedIPOData]:
        print("Starting Playwright scraper for chittorgarh.com...")
        data = []
        ua = fake_useragent.UserAgent()
        current_year = datetime.now().year

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(user_agent=ua.random)
            page = context.new_page()

            try:
                # Use "All IPOs" tab URL
                url = f"https://www.chittorgarh.com/report/ipo-in-india-list-main-board-sme/82/all/?year={current_year}"
                print(f"Navigating to {url}...")
                page.goto(url, timeout=60000)

                # Wait for table
                try:
                    page.wait_for_selector("table", timeout=20000)
                except:
                    print("Table not found on Chittorgarh.")
                    return []

                # Find headers to map columns
                headers = page.locator("table thead tr th").all_inner_texts()
                headers = [h.strip().lower() for h in headers]
                print(f"Headers found: {headers}")

                # Default indices
                idx_name = 0
                idx_open = -1
                idx_close = -1
                idx_price = -1
                idx_lot = -1
                idx_issue_size = -1
                idx_listing_date = -1

                for i, h in enumerate(headers):
                    if "company" in h: idx_name = i
                    elif "open" in h: idx_open = i
                    elif "close" in h: idx_close = i
                    elif "price" in h: idx_price = i
                    elif "lot" in h: idx_lot = i
                    elif "size" in h and "issue" in h: idx_issue_size = i
                    elif "listing" in h: idx_listing_date = i

                rows = page.locator("table tbody tr").all()
                print(f"Found {len(rows)} rows.")

                for row in rows:
                    cells = row.locator("td").all()
                    if not cells: continue

                    texts = [c.inner_text().strip() for c in cells]

                    if len(texts) <= max(idx_name, idx_open, idx_close):
                        continue

                    # Extract data
                    # Try to get name from anchor tag if present, as it's cleaner
                    try:
                        name_cell = cells[idx_name]
                        anchor = name_cell.locator("a").first
                        if anchor.count() > 0:
                            name = anchor.inner_text().strip()
                        else:
                            name = texts[idx_name].split('\n')[0].strip()
                    except:
                        name = texts[idx_name].split('\n')[0].strip()

                    # Dates
                    open_date = None
                    if idx_open != -1:
                        od_str = texts[idx_open]
                        if od_str and od_str != "--":
                            # Usually "Jan 20, 2026" or similar
                            # Try adding year if missing, but usually full date
                            if str(current_year) not in od_str:
                                od_str = f"{od_str} {current_year}"
                            open_date = parse_ipo_date(od_str)[0]

                    close_date = None
                    if idx_close != -1:
                        cd_str = texts[idx_close]
                        if cd_str and cd_str != "--":
                            if str(current_year) not in cd_str:
                                cd_str = f"{cd_str} {current_year}"
                            close_date = parse_ipo_date(cd_str)[0]

                    listing_date = None
                    if idx_listing_date != -1:
                        ld_str = texts[idx_listing_date]
                        if ld_str and ld_str != "--":
                             if str(current_year) not in ld_str:
                                ld_str = f"{ld_str} {current_year}"
                             listing_date = parse_ipo_date(ld_str)[0]

                    # Values
                    price = texts[idx_price] if idx_price != -1 else None
                    lot_size = 0
                    if idx_lot != -1:
                        try:
                            lot_size = int(clean_currency(texts[idx_lot]))
                        except:
                            lot_size = 0

                    issue_size = texts[idx_issue_size] if idx_issue_size != -1 else None

                    # Type detection
                    # Usually inferred from link or just assume Mainboard unless "SME" in name
                    ipo_type = "Mainboard"
                    if "SME" in name or "SME" in (texts[1] if len(texts)>1 else ""): # Sometimes Exchange col has SME
                        ipo_type = "SME"

                    ipo_data = ScrapedIPOData(
                        name=name,
                        ipo_type=ipo_type,
                        price_band=price,
                        open_date=open_date,
                        close_date=close_date,
                        listing_date=listing_date,
                        lot_size=lot_size,
                        issue_size=issue_size,
                        gmp=None, # Chittorgarh list usually doesn't have live GMP in this table
                        source="chittorgarh",
                        last_updated=datetime.utcnow()
                    )
                    data.append(ipo_data)

                print(f"Chittorgarh: Scraped {len(data)} records.")

            except Exception as e:
                print(f"Chittorgarh Scraper Error: {e}")
            finally:
                browser.close()

        return data
