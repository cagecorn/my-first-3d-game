
from playwright.sync_api import sync_playwright, expect
import time

def verify_typewriter(page):
    page.goto("http://localhost:8000")

    # 1. Enter Fake API Key
    page.fill("#api-key-input", "fake_key")
    page.click("#btn-start-game")

    # 2. Wait for the generated log (containing "mist")
    # This ensures we are looking at the dynamic log, not the static welcome message
    log_locator = page.locator(".log-entry").filter(has_text="mist").first

    # Wait for it to exist
    log_locator.wait_for(timeout=10000)

    # 3. Check internal structure (it should have a span)
    span = log_locator.locator("span")

    expect(span).to_be_visible()

    # 4. Wait for typing
    time.sleep(2)

    # 5. Screenshot
    page.screenshot(path="verification/typewriter_verification.png")

    # 6. Verify content
    text = span.text_content()
    print(f"Verified Log Content: {text}")
    assert "mist" in text

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_typewriter(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
