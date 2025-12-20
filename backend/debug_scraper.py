from playwright.sync_api import sync_playwright

def debug_html():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://www.investorgain.com/report/live-ipo-gmp/331/", timeout=60000)
        page.wait_for_selector("table")

        # Save HTML to file
        with open("backend/debug_page.html", "w") as f:
            f.write(page.content())
        print("HTML dumped to backend/debug_page.html")

if __name__ == "__main__":
    debug_html()
