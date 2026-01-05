
from playwright.sync_api import sync_playwright
import os

def run():
    # Ensure directory exists
    os.makedirs('verification', exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Load local index.html
        page.goto('file://' + os.path.abspath('index.html'))

        # Wait for page load
        page.wait_for_timeout(2000)

        # Screenshot
        page.screenshot(path='verification/screenshot.png')
        browser.close()

if __name__ == '__main__':
    run()
