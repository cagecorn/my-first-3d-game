from playwright.sync_api import sync_playwright

def verify_narrative_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 1. Load the game (hosted locally)
        page.goto("http://localhost:8080/index.html")

        # 2. Wait for Setup Layer (API Key Input)
        setup_layer = page.locator("#layer-setup")
        setup_layer.wait_for(state="visible", timeout=5000)

        # 3. Enter Fake API Key
        page.fill("#api-key-input", "FAKE_KEY_FOR_TESTING")
        page.click("#btn-start-game")

        # 4. Wait for Setup to Hide and Book to be visible
        setup_layer.wait_for(state="hidden", timeout=5000)
        page.locator("#book").wait_for(state="visible", timeout=5000)

        # 5. Check logs
        # We expect the log to contain the text returned by the AI (or error text)
        page.wait_for_timeout(3000) # Give it time to 'fetch' and fail

        logs = page.locator("#story-log").inner_text()
        print("Logs found:", logs)

        # Capture screenshot
        page.screenshot(path="verification_flow.png")

        browser.close()

if __name__ == "__main__":
    verify_narrative_flow()
