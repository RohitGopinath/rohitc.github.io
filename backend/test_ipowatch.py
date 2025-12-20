from playwright.sync_api import sync_playwright

def test_ipowatch():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            url = "https://ipowatch.in/ipo-grey-market-premium-latest-ipo-gmp/"
            print(f"Navigating to {url}...")
            page.goto(url, timeout=60000)

            page.wait_for_selector("table", timeout=20000)
            print("Table found.")

            rows = page.locator("table tbody tr").all()
            print(f"Found {len(rows)} rows.")

            if len(rows) > 0:
                print(f"First Row: {rows[0].inner_text()}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    test_ipowatch()
