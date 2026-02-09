from typing import List
from playwright.sync_api import sync_playwright
from datetime import datetime
from .base import BaseScraper, ScrapedIPOData
from .utils import parse_ipo_date, clean_currency
import fake_useragent

class InvestorGainScraper(BaseScraper):
    def scrape(self) -> List[ScrapedIPOData]:
        print("Starting Playwright scraper for investorgain.com...")
        data = []
        ua = fake_useragent.UserAgent()

        with sync_playwright() as p:
            # Launch with random user agent
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(user_agent=ua.random)
            page = context.new_page()

            try:
                url = "https://www.investorgain.com/report/live-ipo-gmp/331/"
                print(f"Navigating to {url}...")
                page.goto(url, timeout=60000)

                # Wait for loader to disappear or table to appear
                try:
                    page.wait_for_selector(".loader-container", state="hidden", timeout=30000)
                except:
                    print("Loader did not disappear, checking for table...")

                # Extra wait for dynamic content
                page.wait_for_timeout(5000)

                page.wait_for_selector("table", timeout=20000)

                # Find the main data table
                # It's usually the first big table
                tables = page.locator("table").all()
                target_table = None
                print(f"InvestorGain: Found {len(tables)} tables.")

                for i, table in enumerate(tables):
                    row_count = table.locator("tr").count()
                    print(f"Table {i}: {row_count} rows.")
                    if row_count > 5:
                        target_table = table
                        break

                if not target_table:
                    print("No suitable table found on InvestorGain.")
                    # Try dumping HTML for debug if needed, but for now just return empty
                    return []

                rows = target_table.locator("tbody tr").all()
                print(f"Found {len(rows)} rows.")

                for row in rows:
                    cells = row.locator("td").all()
                    if len(cells) < 5:
                        continue

                    texts = [c.inner_text().strip() for c in cells]

                    # Skip header/ad rows
                    if not texts or "IPO" in texts[0] or " GMP" in texts[1]:
                        continue

                    # Mapping based on common structure:
                    # 0: Name (e.g., "Fractal Analytics")
                    # 1: Price (e.g., "900")
                    # 2: GMP (e.g., "14 (1.56%)")
                    # 3: Kostak (e.g., "--")
                    # 4: Subject (e.g., "--")
                    # 5: Open (e.g., "09-Feb")
                    # 6: Close (e.g., "11-Feb")
                    # 7: Listing (e.g., "17-Feb")
                    # 8: Fire Rating (e.g., "🔥")

                    ipo_name = texts[0]
                    price_str = texts[1]
                    gmp_raw = texts[2] # "14 (1.56%)"

                    # Extract GMP value
                    gmp_value = clean_currency(gmp_raw.split("(")[0]) if "(" in gmp_raw else clean_currency(gmp_raw)

                    # Dates
                    open_date_str = texts[5] if len(texts) > 5 else None
                    close_date_str = texts[6] if len(texts) > 6 else None
                    listing_date_str = texts[7] if len(texts) > 7 else None

                    # Parse dates
                    # Assuming they are DD-Mon format like "09-Feb"
                    current_year = datetime.now().year
                    open_date = parse_ipo_date(f"{open_date_str} {current_year}")[0] if open_date_str else None
                    close_date = parse_ipo_date(f"{close_date_str} {current_year}")[0] if close_date_str else None
                    listing_date = parse_ipo_date(f"{listing_date_str} {current_year}")[0] if listing_date_str else None

                    # Determine type
                    ipo_type = "Mainboard"
                    if "SME" in ipo_name or "SME" in texts[0]:
                        ipo_type = "SME"

                    # Create Data Object
                    ipo_data = ScrapedIPOData(
                        name=ipo_name,
                        ipo_type=ipo_type,
                        price_band=price_str,
                        open_date=open_date,
                        close_date=close_date,
                        listing_date=listing_date,
                        gmp=gmp_value,
                        source="investorgain",
                        last_updated=datetime.utcnow()
                    )
                    data.append(ipo_data)

                print(f"InvestorGain: Scraped {len(data)} records.")

            except Exception as e:
                print(f"InvestorGain Scraper Error: {e}")
            finally:
                browser.close()

        return data
