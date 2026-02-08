import time
from playwright.sync_api import sync_playwright

def verify_frontend():
    print("Starting Frontend Verification...")
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # 1. Homepage
        print("Navigating to Homepage (http://localhost:3000)...")
        try:
            page.goto("http://localhost:3000", timeout=60000)
            page.wait_for_selector("text=Active Listings", timeout=30000)
            print("Homepage loaded.")
            page.screenshot(path="homepage.png")
            print("Screenshot saved: homepage.png")
        except Exception as e:
            print(f"Failed to load homepage: {e}")
            page.screenshot(path="homepage_error.png")
            browser.close()
            return

        # 2. Click Detail
        print("Clicking first IPO link...")
        try:
            # Find first link in table
            page.click("table tbody tr:first-child a")
            page.wait_for_selector("text=Tentative Timetable", timeout=30000)
            print("Details page loaded.")
            page.screenshot(path="details_page.png")
            print("Screenshot saved: details_page.png")

            # Verify data presence
            content = page.content()
            if "Price Band" in content and "Subscription Status" in content:
                print("verified: Financials and Subscription sections present.")
            else:
                print("WARNING: Missing sections in details page.")

        except Exception as e:
            print(f"Failed to navigate to details: {e}")
            page.screenshot(path="details_error.png")

        # 3. Apply Modal
        print("Opening Apply Modal...")
        try:
            page.click("text=Apply for IPO")
            page.wait_for_selector("text=Apply via Broker", timeout=5000)
            print("Modal opened.")
            page.screenshot(path="apply_modal.png")
            print("Screenshot saved: apply_modal.png")
        except Exception as e:
             print(f"Failed to open modal: {e}")

        browser.close()
        print("Verification Complete.")

if __name__ == "__main__":
    verify_frontend()
