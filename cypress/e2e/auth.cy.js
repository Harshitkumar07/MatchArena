describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display home page for unauthenticated users', () => {
    cy.contains('MatchArena').should('be.visible');
    cy.get('[data-testid="signin-button"]').should('be.visible');
  });

  it('should navigate to auth page when clicking sign in', () => {
    cy.get('[data-testid="signin-button"]').click();
    cy.url().should('include', '/auth');
    cy.contains('Sign in to your account').should('be.visible');
  });

  it('should show validation errors for invalid input', () => {
    cy.visit('/auth');
    
    // Try to submit empty form
    cy.get('button[type="submit"]').contains('Sign in').click();
    cy.contains('Invalid email address').should('be.visible');
    
    // Try invalid email
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('button[type="submit"]').contains('Sign in').click();
    cy.contains('Invalid email address').should('be.visible');
    
    // Try short password
    cy.get('input[type="email"]').clear().type('test@example.com');
    cy.get('input[type="password"]').type('123');
    cy.get('button[type="submit"]').contains('Sign in').click();
    cy.contains('Password must be at least 6 characters').should('be.visible');
  });

  it('should switch between login and signup forms', () => {
    cy.visit('/auth');
    
    // Initially shows login
    cy.contains('Sign in to your account').should('be.visible');
    
    // Switch to signup
    cy.contains('button', 'Sign up').click();
    cy.contains('Create a new account').should('be.visible');
    cy.get('input[placeholder*="Full Name"]').should('be.visible');
    
    // Switch back to login
    cy.contains('button', 'Sign in').click();
    cy.contains('Sign in to your account').should('be.visible');
  });

  it('should successfully sign up a new user', () => {
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    
    cy.visit('/auth');
    cy.contains('button', 'Sign up').click();
    
    // Fill signup form
    cy.get('input[placeholder*="Full Name"]').type('Test User');
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').first().type('password123');
    cy.get('input[type="password"]').last().type('password123');
    
    // Submit form
    cy.get('button[type="submit"]').contains('Sign up').click();
    
    // Should redirect to home after successful signup
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains('Welcome').should('be.visible');
  });

  it('should successfully log in an existing user', () => {
    cy.visit('/auth');
    
    // Fill login form
    cy.get('input[type="email"]').type(Cypress.env('TEST_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('TEST_PASSWORD'));
    
    // Submit form
    cy.get('button[type="submit"]').contains('Sign in').click();
    
    // Should redirect to home after successful login
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('should handle forgot password flow', () => {
    cy.visit('/auth');
    
    cy.contains('Forgot your password?').click();
    
    // In a real test, we'd mock the prompt or use a custom dialog
    cy.on('window:prompt', () => 'test@example.com');
    
    // Verify success message appears
    cy.contains('Password reset email sent').should('be.visible');
  });

  it('should successfully log out', () => {
    // First login
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    
    // Click user menu and logout
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Sign Out').click();
    
    // Should redirect to home and show sign in button
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('[data-testid="signin-button"]').should('be.visible');
  });

  it('should persist authentication on page refresh', () => {
    // Login
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    
    // Verify logged in
    cy.get('[data-testid="user-menu"]').should('be.visible');
    
    // Refresh page
    cy.reload();
    
    // Should still be logged in
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('should redirect to requested page after login', () => {
    // Try to visit protected route
    cy.visit('/profile');
    
    // Should redirect to auth
    cy.url().should('include', '/auth');
    
    // Login
    cy.get('input[type="email"]').type(Cypress.env('TEST_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('TEST_PASSWORD'));
    cy.get('button[type="submit"]').contains('Sign in').click();
    
    // Should redirect to originally requested page
    cy.url().should('include', '/profile');
  });
});
