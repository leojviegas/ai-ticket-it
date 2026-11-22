Cypress.Commands.add("loginUI", (email, password) => {
  cy.clearLocalStorage();
  cy.visit("/");
  cy.get('[data-testid="tab-perfil"]', { timeout: 30000 }).click();
  cy.location("pathname").should("eq", "/perfil");
  cy.intercept("POST", "**/api/auth/login").as("loginReq");
  cy.get('[data-testid="auth-email"]').clear().type(email);
  cy.get('[data-testid="auth-password"]').clear().type(password);
  cy.get('[data-testid="auth-submit-btn"]').click();
  cy.wait("@loginReq").its("response.statusCode").should("eq", 200);
  cy.location("pathname").should("eq", "/");
  cy.contains("Próximos eventos", { timeout: 15000 }).should("be.visible");
});
