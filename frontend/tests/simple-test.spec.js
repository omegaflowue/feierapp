const { test, expect } = require('@playwright/test');

test.describe('Simple Frontend Test', () => {
  test('should load the create event page', async ({ page }) => {
    // Navigate to create event page
    await page.goto('http://localhost:8080/create');
    
    // Wait for page to load
    await page.waitForTimeout(5000);
    
    // Take a screenshot
    await page.screenshot({ path: 'create-event-page.png' });
    
    // Check if the page loaded
    const pageTitle = await page.locator('h3').first().textContent();
    console.log('Page title:', pageTitle);
    
    // Check if form fields are present
    const titleField = await page.locator('input[name="title"]').isVisible();
    const locationField = await page.locator('input[name="location"]').isVisible();
    const submitButton = await page.locator('button[type="submit"]').isVisible();
    
    console.log('Title field visible:', titleField);
    console.log('Location field visible:', locationField);
    console.log('Submit button visible:', submitButton);
    
    expect(titleField).toBe(true);
    expect(locationField).toBe(true);
    expect(submitButton).toBe(true);
  });

  test('should create event with API', async ({ page }) => {
    await page.goto('http://localhost:8080/create');
    await page.waitForTimeout(3000);
    
    // Fill form fields
    await page.fill('input[name="title"]', 'Playwright Test Event');
    await page.fill('input[name="location"]', 'Test Location');
    await page.fill('input[type="datetime-local"]', '2024-12-31T19:00');
    await page.fill('input[name="planner_name"]', 'Test User');
    await page.fill('input[name="planner_email"]', 'test@example.com');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Take screenshot of result
    await page.screenshot({ path: 'after-submit.png' });
    
    // Check current URL or page content
    const currentUrl = page.url();
    console.log('URL after submit:', currentUrl);
    
    // Check for success modal or error message
    const modalVisible = await page.locator('.modal.show').isVisible().catch(() => false);
    const errorVisible = await page.locator('.alert-danger').isVisible().catch(() => false);
    
    console.log('Modal visible:', modalVisible);
    console.log('Error visible:', errorVisible);
    
    if (errorVisible) {
      const errorText = await page.locator('.alert-danger').textContent();
      console.log('Error text:', errorText);
    }
  });
});