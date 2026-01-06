from playwright.sync_api import sync_playwright

def verify_instinct():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to local server
        page.goto("http://localhost:8080/index.html")
        page.fill("#api-key-input", "TEST_KEY")
        page.click("#btn-start-game")
        page.wait_for_selector("text=Key accepted")

        # Inject script to force trigger an instinct event via CombatManager (mock)
        # We simulate the event directly through the app instance logic
        js_trigger = """
        if (window.app && window.app.phaserGame) {
            // Mock data structure expected by main.js handler
            const data = {
                instinctName: 'BLOOD_LUST',
                character: { name: 'Theon' }
            };

            // Access the callback logic. Since it's inside setupCombat closure,
            // we can't easily reach it. Instead, we can verify by checking if we can
            // trigger the UI log manually or simulate a combat flow.

            // EASIER: Let's just create a fake combat manager or just modify the log
            // actually, we can't easily touch the closure 'battleScene' inside setupCombat.

            // Alternative: We can just use the UI log method to simulate the *appearance*
            // but to verify logic we need to trigger the event.

            // Let's rely on the fact we added the code.
            // We will TRY to set up a combat and force an event.

            // 1. Setup Combat
            window.app.state = 'Combat';
            window.app.setupCombat().then(() => {
                 // 2. Force emit event from the manager
                 if (window.app.combatManager) {
                     window.app.combatManager.onEvent('instinct_trigger', data);
                 }
            });
        }
        """

        page.evaluate(js_trigger)

        # Wait for the Red Text
        try:
            page.wait_for_selector("text=INSTINCT AWAKENED", timeout=5000)
            print("Instinct Trigger Visualization Verified!")

            # Take screenshot
            page.screenshot(path="verification/instinct_visual.png")
        except:
            print("Failed to verify Instinct Trigger.")

        browser.close()

if __name__ == "__main__":
    verify_instinct()
