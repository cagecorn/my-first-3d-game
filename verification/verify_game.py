
from playwright.sync_api import sync_playwright
import time
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    cwd = os.getcwd()
    page.goto(f"file://{cwd}/index.html")

    # Wait for input
    page.wait_for_selector("#api-key-input")
    page.fill("#api-key-input", "FAKE_KEY_FOR_TESTING")

    # Click start button by ID
    page.click("#btn-start-game")

    # Wait for game layer
    # The setup layer is hidden, not removed.
    # Let's wait for a log entry to appear in the story-log
    try:
        page.wait_for_selector("#story-log .log-entry", timeout=5000)
    except:
        print("Log entry didn't appear, likely because API key invalid or JS error.")
        # We can still screenshot

    time.sleep(2)
    page.screenshot(path="verification/game_screen.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
