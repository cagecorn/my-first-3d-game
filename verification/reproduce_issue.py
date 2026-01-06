from playwright.sync_api import sync_playwright

def verify_log_scroll():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        # Load the page
        page.goto("http://localhost:8000/index.html")

        # Inject many lines into the story log to force overflow
        script = """
            const log = document.getElementById('story-log');
            for (let i = 0; i < 50; i++) {
                const div = document.createElement('div');
                div.className = 'log-entry mb-4 text-gray-700 italic';
                div.textContent = `Log Entry ${i}: This is a long line of text to ensure we take up space and verify scrolling behavior.`;
                log.appendChild(div);
            }
        """
        page.evaluate(script)

        # Wait a bit for rendering
        page.wait_for_timeout(1000)

        # Check if the book container has expanded beyond expected height
        # In CSS, #book is h-[90%] of viewport.
        # We can check bounding box of #book and #story-log

        book_box = page.locator("#book").bounding_box()
        log_box = page.locator("#story-log").bounding_box()

        print(f"Book height: {book_box['height']}")
        print(f"Log height: {log_box['height']}")

        # Take a screenshot
        page.screenshot(path="verification/before_fix.png")

        browser.close()

if __name__ == "__main__":
    verify_log_scroll()
