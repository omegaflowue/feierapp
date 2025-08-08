describe('Event Creation E2E Test', () => {
  beforeEach(() => {
    // Visit the home page
    cy.visit('/')
  })

  it('should successfully create an event', () => {
    // Click on "Event erstellen" button
    cy.contains('Event erstellen').click()
    
    // Should navigate to create event page
    cy.url().should('include', '/create')
    cy.contains('Neues Event erstellen').should('be.visible')

    // Fill out the event form
    cy.get('#title').type('Test Event - Cypress')
    
    // Set event date (tomorrow at 18:00)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:MM
    cy.get('#event_date').type(dateString)
    
    cy.get('#location').type('Test Location 123, 12345 Test City')
    cy.get('#description').type('This is a test event created by Cypress E2E test')
    
    // Fill out planner information
    cy.get('#planner_name').type('Cypress Test User')
    cy.get('#planner_email').type('test@cypress.com')
    cy.get('#planner_phone').type('+49 123 456789')

    // Intercept the API call to see what happens
    cy.intercept('POST', '**/events').as('createEvent')

    // Submit the form
    cy.get('button[type="submit"]').click()

    // Wait a bit for the form submission
    cy.wait(2000)

    // Check for either success modal or error message
    cy.get('body').then(($body) => {
      if ($body.find('#successModal.show').length > 0) {
        // Success case
        cy.get('#successModal').should('be.visible')
        cy.contains('Event erfolgreich erstellt!').should('be.visible')
      } else if ($body.find('.alert-danger').length > 0) {
        // Error case - log the error and fail test with details
        cy.get('.alert-danger').should('be.visible').then(($error) => {
          const errorText = $error.text()
          cy.log('Error message:', errorText)
          throw new Error(`Event creation failed with error: ${errorText}`)
        })
      } else {
        // Unknown state
        cy.screenshot('unknown-state')
        throw new Error('Unknown state after form submission - no success modal or error message found')
      }
    })
    
    // Verify event details in modal
    cy.contains('Test Event - Cypress').should('be.visible')
    cy.contains('Test Location 123, 12345 Test City').should('be.visible')
    
    // Check that event code is generated and store it
    cy.get('code').should('exist').and('not.be.empty').then(($code) => {
      const eventCode = $code.text()
      cy.log('Generated event code:', eventCode)
      
      // Verify event exists in backend by calling API directly
      cy.request('GET', `http://localhost:8081/events/${eventCode}`)
        .then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.have.property('id')
          expect(response.body).to.have.property('title', 'Test Event - Cypress')
          expect(response.body).to.have.property('unique_code', eventCode)
          cy.log('Event verified in backend API:', response.body)
          
          // Additional verification: Check that event has database fields
          expect(response.body).to.have.property('created_at')
          expect(response.body).to.have.property('updated_at')
          expect(response.body.id).to.be.a('number')
          cy.log('Event confirmed to be stored in database with ID:', response.body.id)
        })
        
      // Also verify event appears in events list
      cy.request('GET', 'http://localhost:8081/events')
        .then((response) => {
          expect(response.status).to.eq(200)
          expect(response.body).to.be.an('array')
          const createdEvent = response.body.find(e => e.unique_code === eventCode)
          expect(createdEvent).to.exist
          cy.log('Event found in database events list:', createdEvent)
        })
    })
    
    // Click "Zum Event-Dashboard" button
    cy.contains('Zum Event-Dashboard').click()
    
    // Should navigate to event dashboard
    cy.url().should('match', /\/event\/[a-zA-Z0-9]+/)
  })

  it('should show validation errors for empty required fields', () => {
    // Navigate to create event page
    cy.visit('/create')
    
    // Try to submit empty form
    cy.get('button[type="submit"]').click()
    
    // Browser validation should prevent submission
    cy.get('#title:invalid').should('exist')
    cy.get('#event_date:invalid').should('exist')
    cy.get('#location:invalid').should('exist')
    cy.get('#planner_name:invalid').should('exist')
    cy.get('#planner_email:invalid').should('exist')
  })

  it('should handle API errors gracefully', () => {
    // Navigate to create event page
    cy.visit('/create')
    
    // Fill form with invalid email to potentially trigger server error
    cy.get('#title').type('Test Event')
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().slice(0, 16)
    cy.get('#event_date').type(dateString)
    
    cy.get('#location').type('Test Location')
    cy.get('#planner_name').type('Test User')
    cy.get('#planner_email').type('invalid-email') // Invalid email format
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Should show error message (either validation or API error)
    cy.get('.alert-danger', { timeout: 5000 }).should('be.visible')
  })
})