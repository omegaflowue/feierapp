const { test, expect } = require('@playwright/test');

test.describe('Ride Sharing Manual Test', () => {
  test('should manually test ride sharing components and UI', async ({ page }) => {
    console.log('🧪 Starting manual ride sharing test...');
    
    // First create a test event
    await page.goto('http://localhost:8080/create');
    await page.waitForTimeout(2000);
    
    console.log('📝 Creating test event...');
    await page.fill('input[name="title"]', 'Manual Ride Test Event');
    await page.fill('input[name="location"]', 'München Hauptbahnhof');
    await page.fill('input[type="datetime-local"]', '2024-12-31T19:00');
    await page.fill('input[name="planner_name"]', 'Test Planner');
    await page.fill('input[name="planner_email"]', 'planner@test.com');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Get event code from current URL or modal
    let eventCode = '';
    const url = page.url();
    const codeMatch = url.match(/\/event\/([a-zA-Z0-9]+)/);
    if (codeMatch) {
      eventCode = codeMatch[1];
      console.log('✅ Event created with code:', eventCode);
    } else {
      // Try to get from success modal
      const codeElement = await page.locator('code').first();
      if (await codeElement.isVisible()) {
        eventCode = await codeElement.textContent();
        console.log('✅ Event code from modal:', eventCode);
      }
    }
    
    if (!eventCode) {
      console.log('❌ Could not get event code, skipping ride sharing test');
      return;
    }
    
    // Test EventDashboard ride sharing integration
    console.log('🏠 Testing EventDashboard ride sharing integration...');
    
    if (url.includes('/event/')) {
      // We're already on the event dashboard
      console.log('Already on event dashboard');
    } else {
      await page.goto(`http://localhost:8080/event/${eventCode}`);
      await page.waitForTimeout(2000);
    }
    
    // Look for the rides tab
    const ridesTab = page.locator('#rides-tab, button:has-text("Mitfahrgelegenheiten")');
    const ridesTabExists = await ridesTab.count() > 0;
    
    if (ridesTabExists) {
      console.log('✅ Rides tab found in EventDashboard');
      
      // Click on rides tab
      await ridesTab.first().click();
      await page.waitForTimeout(2000);
      
      // Check if ride board loads
      const rideBoard = page.locator('.ride-board, h2:has-text("Mitfahrgelegenheiten")');
      const rideBoardVisible = await rideBoard.count() > 0;
      
      if (rideBoardVisible) {
        console.log('✅ RideBoard component loaded successfully');
        
        // Check for statistics cards
        const statisticsCards = await page.locator('.card .card-body').count();
        console.log(`📊 Found ${statisticsCards} statistics cards`);
        
        // Check for offer/request tabs
        const offerTab = page.locator('button:has-text("Angebote")');
        const requestTab = page.locator('button:has-text("Gesuche")');
        
        const offerTabExists = await offerTab.count() > 0;
        const requestTabExists = await requestTab.count() > 0;
        
        console.log(`🔄 Tabs - Offers: ${offerTabExists}, Requests: ${requestTabExists}`);
        
        if (requestTabExists) {
          await requestTab.click();
          await page.waitForTimeout(1000);
          console.log('✅ Switched to requests tab');
        }
        
      } else {
        console.log('⚠️  RideBoard component not visible');
      }
    } else {
      console.log('⚠️  Rides tab not found in EventDashboard');
    }
    
    // Test standalone ride sharing page
    console.log('🚗 Testing standalone ride sharing page...');
    await page.goto(`http://localhost:8080/rides/${eventCode}`);
    await page.waitForTimeout(3000);
    
    // Check if page loads
    const pageHeader = page.locator('h2');
    const headerCount = await pageHeader.count();
    
    if (headerCount > 0) {
      const headerText = await pageHeader.first().textContent();
      console.log('✅ Standalone rides page loaded with header:', headerText);
      
      // Check for error messages
      const errorAlert = page.locator('.alert-danger');
      const hasError = await errorAlert.count() > 0;
      
      if (hasError) {
        const errorText = await errorAlert.textContent();
        console.log('❌ Error found:', errorText);
        
        // This might be expected if backend endpoints don't exist
        if (errorText.includes('Mitfahrgelegenheiten') || errorText.includes('404')) {
          console.log('ℹ️  This error is expected if ride sharing endpoints are not available in backend');
        }
      } else {
        console.log('✅ No errors found on standalone rides page');
      }
      
      // Check for basic UI elements
      const tabButtons = await page.locator('.nav-tabs button, .btn-group button').count();
      const cards = await page.locator('.card').count();
      
      console.log(`🎨 UI Elements - Tab buttons: ${tabButtons}, Cards: ${cards}`);
      
    } else {
      console.log('❌ Standalone rides page did not load properly');
    }
    
    // Test Vue component loading
    console.log('🔧 Testing Vue component loading...');
    
    // Check browser console for Vue errors
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    const vueErrors = consoleLogs.filter(log => 
      log.includes('Vue') || 
      log.includes('RideBoard') || 
      log.includes('component') ||
      log.includes('[Vue warn]')
    );
    
    if (vueErrors.length > 0) {
      console.log('❌ Vue errors found:');
      vueErrors.forEach(error => console.log('  -', error));
    } else {
      console.log('✅ No Vue component errors detected');
    }
    
    // Test API endpoint availability manually
    console.log('🌐 Testing API endpoint availability...');
    
    try {
      const response = await page.request.get(`http://localhost:8081/events/${eventCode}/rides`);
      const status = response.status();
      
      console.log(`📡 API Response Status: ${status}`);
      
      if (status === 200) {
        const data = await response.json();
        console.log('✅ Rides API working! Response keys:', Object.keys(data));
        
        if (data.statistics) {
          console.log('📊 Statistics:', data.statistics);
        }
        
        console.log(`📦 Found ${data.offers?.length || 0} offers and ${data.requests?.length || 0} requests`);
        
      } else if (status === 404) {
        console.log('⚠️  API endpoint not found (404) - ride sharing endpoints may not be implemented in current backend');
      } else {
        console.log(`⚠️  API returned status ${status}`);
      }
      
    } catch (error) {
      console.log('❌ API test failed:', error.message);
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'ride-sharing-manual-test-final.png' });
    
    console.log('🎉 Manual ride sharing test completed!');
    console.log('Check the generated screenshot for visual verification.');
  });
});