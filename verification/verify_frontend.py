from playwright.sync_api import sync_playwright
import time

def verify_frontend():
    print("Starting Playwright verification...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # Wait for server to start
            time.sleep(5)

            # Go to localhost
            print("Navigating to http://localhost:3000")
            page.goto("http://localhost:3000", timeout=60000)

            # Wait for page to load
            page.wait_for_load_state("networkidle")

            # Screenshot full page
            print("Taking main page screenshot...")
            page.screenshot(path="verification/home_page.png", full_page=True)

            # Click Predict Modal
            print("Clicking Predict button...")
            page.click("text=PREDICT")
            time.sleep(1)

            # Screenshot Modal
            print("Taking modal screenshot...")
            page.screenshot(path="verification/predict_modal.png")

            print("Verification complete.")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
