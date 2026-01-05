from playwright.sync_api import sync_playwright

def verify_game():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the local server
        page.goto("http://localhost:8000/index.html")

        # Wait for the setup modal to appear (it should be the first thing)
        print("Waiting for Setup Modal...")
        page.wait_for_selector('#layer-setup')

        # Take a screenshot of the Setup Modal
        page.screenshot(path="verification/step1_setup.png")
        print("Screenshot 1 (Setup) taken.")

        # Enter API Key (Mock)
        page.fill('#api-key-input', 'mock_api_key_12345')
        page.click('#btn-start-game')

        # Wait for the book and Phaser canvas
        print("Waiting for Game to Load...")
        page.wait_for_selector('#book')
        page.wait_for_selector('#phaser-container canvas')

        # Wait a bit for Phaser to render the initial scene (AP bars etc)
        page.wait_for_timeout(2000)

        # Check if text log updated
        log_text = page.inner_text('#story-log')
        print(f"Log Text: {log_text}")

        if "Visual engine initialized" in log_text:
            print("Verified: Game started and Log updated.")

        # Take a screenshot of the main game
        page.screenshot(path="verification/step2_gameplay.png")
        print("Screenshot 2 (Gameplay) taken.")

        browser.close()

if __name__ == "__main__":
    verify_game()
