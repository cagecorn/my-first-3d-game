from playwright.sync_api import sync_playwright

def verify_api_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game
        page.goto("http://localhost:8000/index.html")

        # Check if setup layer is visible
        setup_layer = page.locator("#layer-setup")
        if setup_layer.is_visible():
            print("Setup layer is visible.")
        else:
            print("Setup layer is NOT visible.")

        # Take initial screenshot
        page.screenshot(path="verification/step1_modal.png")

        # Enter API Key
        page.fill("#api-key-input", "DUMMY_API_KEY_12345")

        # Click Start Game
        page.click("#btn-start-game")

        # Wait for setup layer to disappear
        setup_layer.wait_for(state="hidden")
        print("Setup layer hidden.")

        # Wait for game log to show initialization text
        # "게임을 초기화합니다..."
        page.wait_for_selector("#game-log")

        # Take screenshot of game started
        page.screenshot(path="verification/step2_game_started.png")

        browser.close()

if __name__ == "__main__":
    verify_api_modal()
