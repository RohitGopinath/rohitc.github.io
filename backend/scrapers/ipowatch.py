from typing import List
from playwright.sync_api import sync_playwright
from datetime import datetime
from .base import BaseScraper, ScrapedIPOData
from .utils import parse_ipo_date, clean_currency
import fake_useragent

class IPOWatchScraper(BaseScraper):
    def scrape(self) -> List[ScrapedIPOData]:
        print("Starting Playwright scraper for ipowatch.in...")
        data = []
        ua = fake_useragent.UserAgent()

        with sync_playwright() as p:
            # Launch with random user agent
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(user_agent=ua.random)
            page = context.new_page()

            try:
                url = "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/"
                print(f"Navigating to {url}...")
                page.goto(url, timeout=60000)

                # Wait for table
                page.wait_for_selector("table", timeout=20000)

                # Find the main data table
                rows = page.locator("table tbody tr").all()
                print(f"Found {len(rows)} rows.")

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
                    date_str = texts[4]
                    ipo_type_raw = texts[5] if len(texts) > 5 else "Mainboard"

                    # Parse Dates
                    open_date, close_date = parse_ipo_date(date_str)

                    # Normalize Type
                    if "SME" in ipo_type_raw:
                        ipo_type = "SME"
                    else:
                        ipo_type = "Mainboard"

                    # Parse Values
                    gmp_value = clean_currency(gmp_str)

                    # Create Data Object
                    ipo_data = ScrapedIPOData(
                        name=ipo_name,
                        ipo_type=ipo_type,
                        price_band=price_str,
                        open_date=open_date,
                        close_date=close_date,
                        gmp=gmp_value,
                        source="ipowatch",
                        last_updated=datetime.utcnow()
                    )
                    data.append(ipo_data)

                print(f"IPOWatch: Scraped {len(data)} records.")

            except Exception as e:
                print(f"IPOWatch Scraper Error: {e}")
            finally:
                browser.close()

        return data
