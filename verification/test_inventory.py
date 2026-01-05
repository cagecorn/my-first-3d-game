from playwright.sync_api import sync_playwright

def verify_inventory():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080/index.html")

        # Wait for game to load
        page.wait_for_selector("#btn-inventory")

        # Click Inventory
        page.click("#btn-inventory")

        # Wait for modal
        page.wait_for_selector("#modal-content h3")

        # Screenshot
        page.screenshot(path="verification/inventory_empty.png")

        # Verify text
        content = page.inner_text("#modal-content")
        print("Modal content:", content)

        browser.close()

if __name__ == "__main__":
    verify_inventory()
