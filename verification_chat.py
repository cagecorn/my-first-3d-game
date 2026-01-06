from playwright.sync_api import sync_playwright, expect
import os

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to the local server
    page.goto("http://localhost:8000")

    # 1. Bypass Setup (Inject API Key)
    page.evaluate("localStorage.setItem('google_api_key', 'DUMMY_KEY')")
    page.reload()

    # Wait for the game to initialize and log "Grimoire connected"
    expect(page.locator("#story-log")).to_contain_text("Grimoire connected", timeout=10000)

    # 2. Trigger Chat Manually (Simulate entering a Rest page)
    # We use page.evaluate to access the window.Engine object we created
    print("Opening Chat...")
    page.evaluate("Engine.openChat('Rest')")

    # Verify Chat Overlay is visible
    chat_overlay = page.locator("#chat-overlay")
    expect(chat_overlay).to_be_visible()

    # Verify Title
    expect(page.locator("#chat-mode-title")).to_have_text("🔥 CAMPFIRE TALK")

    # 3. Send a Message
    print("Sending Message...")
    page.fill("#user-input", "Hello Chris")
    page.click("button:text('SEND')")

    # Verify User Message appears
    expect(page.locator(".chat-msg.user")).to_contain_text("Hello Chris")

    # 4. Wait for AI Response (simulated 1s delay)
    print("Waiting for AI Response...")
    page.wait_for_timeout(1500)

    # Verify AI Message appears
    expect(page.locator(".chat-msg.ai")).to_contain_text("Hello Chris") # Our mock echoes or responds
    # Actually our mock logic in main.js:
    # if libido -> "..."
    # else -> "(고개를 끄덕이며) \"Hello Chris\"라... 명심하겠습니다, 메시아여."
    expect(page.locator(".chat-msg.ai")).to_contain_text("명심하겠습니다")

    # 5. Take Screenshot
    if not os.path.exists("verification"):
        os.makedirs("verification")

    page.screenshot(path="verification/chat_verification.png")
    print("Screenshot saved to verification/chat_verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
