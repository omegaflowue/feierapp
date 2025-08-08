const { test, expect } = require('@playwright/test');

test.describe('Event Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigiere zur Startseite
    await page.goto('http://localhost:8080');
  });

  test('should create a new event successfully', async ({ page }) => {
    // Klick auf "Event erstellen" oder Navigate zur Create-Seite
    await page.goto('http://localhost:8080/create');
    
    // Warte bis die Seite geladen ist
    await page.waitForLoadState('networkidle');
    
    // Fülle das Event-Formular aus
    await page.fill('input[name="title"]', 'Test Event');
    await page.fill('textarea[name="description"]', 'Das ist ein Test Event');
    await page.fill('input[name="location"]', 'Test Location');
    
    // Datum und Zeit setzen
    await page.fill('input[type="datetime-local"]', '2024-12-31T19:00');
    
    // Planer-Informationen
    await page.fill('input[name="planner_name"]', 'Max Mustermann');
    await page.fill('input[name="planner_email"]', 'max@example.com');
    await page.fill('input[name="planner_phone"]', '0123456789');
    
    // Event erstellen
    await page.click('button[type="submit"]');
    
    // Warte auf Erfolg oder Fehler
    await page.waitForTimeout(2000);
    
    // Prüfe auf Fehler oder Erfolgsmeldung
    const errorMessage = await page.locator('.alert-danger, .error').first().textContent().catch(() => null);
    const successMessage = await page.locator('.alert-success, .success').first().textContent().catch(() => null);
    
    console.log('Error message:', errorMessage);
    console.log('Success message:', successMessage);
    
    // Prüfe die aktuelle URL
    const currentUrl = page.url();
    console.log('Current URL after submit:', currentUrl);
    
    // Screenshot für Debugging
    await page.screenshot({ path: 'event-creation-result.png' });
    
    // Erwarte, dass das Event erfolgreich erstellt wurde
    if (errorMessage) {
      console.error('Event creation failed with error:', errorMessage);
    }
    
    // Prüfe ob wir zur Event-Dashboard-Seite weitergeleitet wurden
    expect(currentUrl).toMatch(/\/event\/[a-zA-Z0-9]+/);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('http://localhost:8080/create');
    await page.waitForLoadState('networkidle');
    
    // Versuche Event ohne Daten zu erstellen
    await page.click('button[type="submit"]');
    
    // Warte auf Validierungsfehler
    await page.waitForTimeout(1000);
    
    // Screenshot für Debugging
    await page.screenshot({ path: 'validation-errors.png' });
    
    // Prüfe auf Validierungsfehler
    const validationErrors = await page.locator('.invalid-feedback, .error-message').count();
    expect(validationErrors).toBeGreaterThan(0);
  });

  test('should show network error if backend is unavailable', async ({ page }) => {
    // Intercepte API calls und simuliere Fehler
    await page.route('**/events', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Server Error' })
      });
    });

    await page.goto('http://localhost:8080/create');
    await page.waitForLoadState('networkidle');
    
    // Fülle minimale Daten aus
    await page.fill('input[name="title"]', 'Test Event');
    await page.fill('input[name="location"]', 'Test Location');
    await page.fill('input[type="datetime-local"]', '2024-12-31T19:00');
    await page.fill('input[name="planner_name"]', 'Max Mustermann');
    await page.fill('input[name="planner_email"]', 'max@example.com');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Screenshot für Debugging
    await page.screenshot({ path: 'network-error.png' });
    
    // Prüfe auf Fehlermeldung
    const errorMessage = await page.locator('.alert-danger, .error').first().textContent().catch(() => null);
    console.log('Network error message:', errorMessage);
    
    expect(errorMessage).toBeTruthy();
  });
});