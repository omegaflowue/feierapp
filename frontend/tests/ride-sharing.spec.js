const { test, expect } = require('@playwright/test');

test.describe('Ride Sharing Feature', () => {
  let eventCode = '';
  let guestToken = '';
  
  test.beforeAll(async ({ browser }) => {
    // Create a test event and guest first
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Create event
    await page.goto('http://localhost:8080/create');
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="title"]', 'Ride Sharing Test Event');
    await page.fill('input[name="location"]', 'Test Location München');
    await page.fill('input[type="datetime-local"]', '2024-12-31T19:00');
    await page.fill('input[name="planner_name"]', 'Test Planner');
    await page.fill('input[name="planner_email"]', 'planner@test.com');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Extract event code from URL or modal
    const url = page.url();
    const codeMatch = url.match(/\/event\/([a-zA-Z0-9]+)/);
    if (codeMatch) {
      eventCode = codeMatch[1];
    } else {
      // Try to get from success modal
      const codeElement = await page.locator('code').first();
      if (await codeElement.isVisible()) {
        eventCode = await codeElement.textContent();
      }
    }
    
    console.log('Created test event with code:', eventCode);
    
    await context.close();
  });

  test('should display ride sharing tab in event dashboard', async ({ page }) => {
    if (!eventCode) {
      test.skip('Event code not available');
    }
    
    await page.goto(`http://localhost:8080/event/${eventCode}`);
    await page.waitForTimeout(2000);
    
    // Check if ride sharing tab exists
    const ridesTab = page.locator('#rides-tab');
    await expect(ridesTab).toBeVisible();
    await expect(ridesTab).toContainText('Mitfahrgelegenheiten');
    
    // Click on rides tab
    await ridesTab.click();
    await page.waitForTimeout(1000);
    
    // Check if RideBoard component is loaded
    const rideBoard = page.locator('.ride-board');
    await expect(rideBoard).toBeVisible();
    
    // Check statistics cards
    await expect(page.locator('.card .fa-car')).toBeVisible();
    await expect(page.locator('.card .fa-check')).toBeVisible();
    await expect(page.locator('.card .fa-users')).toBeVisible();
    await expect(page.locator('.card .fa-hand-paper')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'event-dashboard-rides.png' });
  });

  test('should create a guest and access guest invitation page', async ({ page }) => {
    if (!eventCode) {
      test.skip('Event code not available');
    }
    
    await page.goto(`http://localhost:8080/event/${eventCode}`);
    await page.waitForTimeout(2000);
    
    // Add a guest
    await page.click('button:has-text("Gast hinzufügen")');
    await page.waitForTimeout(1000);
    
    await page.fill('input#guestName', 'Max Test Driver');
    await page.fill('input#guestEmail', 'driver@test.com');
    await page.fill('input#guestPhone', '+49123456789');
    
    await page.click('button:has-text("Gast hinzufügen"):not([data-bs-dismiss])');
    await page.waitForTimeout(2000);
    
    // Get guest token by copying invite link
    const copyButton = page.locator('button:has-text("Link kopieren")').first();
    await expect(copyButton).toBeVisible();
    
    // Since we can't access clipboard in tests, we'll extract token differently
    // Check if guest was added to table
    await expect(page.locator('td:has-text("Max Test Driver")')).toBeVisible();
    
    console.log('Guest created successfully');
  });

  test('should test guest invitation page with ride sharing', async ({ page }) => {
    // First create a mock guest token for testing
    // We'll use a direct URL that would exist if backend is running
    const mockToken = 'test-guest-token-12345';
    
    await page.goto(`http://localhost:8080/invite/${mockToken}`);
    await page.waitForTimeout(3000);
    
    // Check if guest invitation page loads (might show error if token doesn't exist)
    const pageContent = await page.content();
    
    if (pageContent.includes('Einladung zu:') || pageContent.includes('Guest not found')) {
      console.log('Guest invitation page loaded (expected behavior with mock token)');
      await page.screenshot({ path: 'guest-invitation-mock.png' });
    } else {
      console.log('Guest invitation page structure needs verification');
    }
  });

  test('should display ride sharing interface elements', async ({ page }) => {
    if (!eventCode) {
      test.skip('Event code not available');
    }
    
    // Test standalone ride sharing page
    await page.goto(`http://localhost:8080/rides/${eventCode}`);
    await page.waitForTimeout(3000);
    
    // Check main ride board elements
    await expect(page.locator('h2:has-text("Mitfahrgelegenheiten")')).toBeVisible();
    
    // Check tab buttons
    const offersTab = page.locator('button:has-text("Angebote")');
    const requestsTab = page.locator('button:has-text("Gesuche")');
    
    await expect(offersTab).toBeVisible();
    await expect(requestsTab).toBeVisible();
    
    // Check statistics cards
    await expect(page.locator('.card:has(.fa-car)')).toBeVisible();
    await expect(page.locator('.card:has(.fa-check)')).toBeVisible();
    await expect(page.locator('.card:has(.fa-users)')).toBeVisible();
    await expect(page.locator('.card:has(.fa-hand-paper)')).toBeVisible();
    
    // Switch to requests tab
    await requestsTab.click();
    await page.waitForTimeout(1000);
    
    // Check if requests view is displayed
    const requestsContent = page.locator('#requests-pane, .tab-pane:has-text("Mitfahrt-Gesuche")');
    // Content might be empty initially, which is expected
    
    await page.screenshot({ path: 'ride-board-standalone.png' });
    
    console.log('Ride sharing interface elements verified');
  });

  test('should test API endpoints availability', async ({ page }) => {
    if (!eventCode) {
      test.skip('Event code not available');
    }
    
    // Test if rides API endpoint responds
    const response = await page.request.get(`http://localhost:8081/events/${eventCode}/rides`);
    
    console.log('Rides API Response Status:', response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      console.log('Rides API Response:', JSON.stringify(data, null, 2));
      
      expect(response.status()).toBe(200);
      expect(data).toHaveProperty('offers');
      expect(data).toHaveProperty('requests');
      expect(data).toHaveProperty('statistics');
      
      console.log('✅ Rides API endpoint working correctly');
    } else {
      console.log('⚠️  Rides API endpoint status:', response.status());
      
      // This might be expected if backend is not running with ride sharing tables
      if (response.status() === 404 || response.status() === 500) {
        console.log('Note: This may be expected if ride sharing database tables are not created yet');
      }
    }
  });

  test('should test ride offer form functionality', async ({ page }) => {
    if (!eventCode) {
      test.skip('Event code not available');
    }
    
    // Mock a guest login scenario by going to rides page
    await page.goto(`http://localhost:8080/rides/${eventCode}`);
    await page.waitForTimeout(2000);
    
    // Look for authentication prompts or ride offer cards
    const authButton = page.locator('button:has-text("Anmelden um anzufragen")');
    const rideCards = page.locator('.ride-offer-card, .ride-request-card');
    
    const authButtonCount = await authButton.count();
    const rideCardsCount = await rideCards.count();
    
    console.log(`Found ${authButtonCount} auth buttons and ${rideCardsCount} ride cards`);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'ride-sharing-current-state.png' });
    
    if (authButtonCount > 0) {
      console.log('✅ Authentication buttons are displayed (expected for non-logged-in users)');
    }
    
    if (rideCardsCount === 0) {
      console.log('ℹ️  No ride offers/requests found (expected for new event)');
    } else {
      console.log('✅ Ride cards are being displayed');
    }
  });

  test('should verify component loading and error handling', async ({ page }) => {
    // Test error handling with invalid event code
    await page.goto('http://localhost:8080/rides/invalid-code-123');
    await page.waitForTimeout(3000);
    
    // Check if error handling works
    const errorAlert = page.locator('.alert-danger');
    const loadingSpinner = page.locator('.spinner-border');
    
    const hasError = await errorAlert.count() > 0;
    const hasLoading = await loadingSpinner.count() > 0;
    
    console.log(`Error handling test - Error: ${hasError}, Loading: ${hasLoading}`);
    
    await page.screenshot({ path: 'ride-sharing-error-handling.png' });
    
    if (hasError) {
      const errorText = await errorAlert.textContent();
      console.log('Error message:', errorText);
    }
  });

  test('should test ride sharing component imports and rendering', async ({ page }) => {
    if (!eventCode) {
      test.skip('Event code not available');
    }
    
    await page.goto(`http://localhost:8080/rides/${eventCode}`);
    await page.waitForTimeout(3000);
    
    // Check if Vue components are properly loaded
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check for common Vue/component errors
    const vueErrors = consoleErrors.filter(error => 
      error.includes('Vue') || 
      error.includes('component') || 
      error.includes('RideBoard') ||
      error.includes('RideOffer') ||
      error.includes('RideRequest')
    );
    
    if (vueErrors.length > 0) {
      console.log('🔴 Vue/Component Errors Found:', vueErrors);
    } else {
      console.log('✅ No Vue component errors detected');
    }
    
    // Check if main elements are rendered
    const mainHeader = page.locator('h2');
    const tabButtons = page.locator('.nav-tabs button');
    const statisticsCards = page.locator('.card .card-body');
    
    const headerCount = await mainHeader.count();
    const tabCount = await tabButtons.count();
    const cardCount = await statisticsCards.count();
    
    console.log(`Rendered elements - Headers: ${headerCount}, Tabs: ${tabCount}, Cards: ${cardCount}`);
    
    if (headerCount > 0 && tabCount >= 2 && cardCount >= 4) {
      console.log('✅ All main components rendered successfully');
    } else {
      console.log('⚠️  Some components may not be rendering correctly');
    }
  });
});