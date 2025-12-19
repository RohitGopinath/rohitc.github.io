from playwright.sync_api import sync_playwright

def test_scrape():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            print("Navigating to investorgain...")
            page.goto("https://www.investorgain.com/report/live-ipo-gmp/331/", timeout=60000)

            # Wait for the table to load
            page.wait_for_selector("table", timeout=10000)

            # Get page content
            title = page.title()
            print(f"Page Title: {title}")

            # Try to find the IPO names
            # Based on inspection, looking for links inside the table
            rows = page.locator("table tbody tr").all()
            print(f"Found {len(rows)} rows.")

            if len(rows) > 0:
                first_row = rows[0].inner_text()
                print(f"First Row Data: {first_row}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test_scrape()
