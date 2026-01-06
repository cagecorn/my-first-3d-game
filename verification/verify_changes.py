from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:8080/index.html")

        # Wait for log
        page.wait_for_selector("#story-log")

        # Simulate API Key entry
        page.fill("#api-key-input", "DUMMY_KEY_FOR_TEST")
        page.click("#btn-start-game")

        # Wait for game to init (log message)
        page.wait_for_selector("text=Key accepted")

        # Force a REST PAGE by executing JS on the window.app instance
        # We need to access 'window.app'
        page.evaluate("window.app.triggerRestEvent()")

        # Wait for Rest Interactions
        page.wait_for_selector("button:has-text('Tend to')")

        # Take Screenshot 1: Rest Options
        page.screenshot(path="verification/rest_event.png")
        print("Rest Event Screenshot taken.")

        # Click a button
        page.click("button:has-text('Tend to Chris')")

        # Check for orange styling in log
        page.wait_for_selector(".bg-orange-50")

        # Take Screenshot 2: Rest Result
        page.screenshot(path="verification/rest_result.png")
        print("Rest Result Screenshot taken.")

        # Force a LIBIDO PAGE
        page.evaluate("window.app.triggerLibidoScene()")

        # Wait for Libido Choices
        page.wait_for_selector("button:has-text('Admire')")

        # Take Screenshot 3: Libido Options
        page.screenshot(path="verification/libido_event.png")
        print("Libido Event Screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_frontend()
