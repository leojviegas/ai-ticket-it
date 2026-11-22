describe("02 - Autenticación y redirección ante token expirado", () => {
  it("protege secciones privadas para invitados y permite registro, login y redirección ante 401", () => {
    cy.clearLocalStorage();
    cy.visit("/");
    cy.get('[data-testid="tab-favoritos"]', { timeout: 30000 }).click();
    cy.contains("Guardá tus eventos favoritos").should("be.visible");

    // Registro de cuenta nueva
    cy.get('[data-testid="tab-perfil"]').click();
    cy.location("pathname").should("eq", "/perfil");
    cy.get('[data-testid="auth-mode-register"]').click();
    const uniqueEmail = `e2e_${Date.now()}@ticketit.com`;
    cy.intercept("POST", "**/api/auth/register").as("registerReq");
    cy.get('[data-testid="auth-nombre"]').type("Camila");
    cy.get('[data-testid="auth-apellido"]').type("Vega");
    cy.get('[data-testid="auth-email"]').type(uniqueEmail);
    cy.get('[data-testid="auth-password"]').type("ClaveSegura123");
    cy.get('[data-testid="auth-submit-btn"]').click();

    cy.wait("@registerReq").its("response.statusCode").should("eq", 201);
    cy.location("pathname").should("eq", "/");
    cy.contains("Próximos eventos").should("be.visible");
    cy.get('[data-testid="tab-perfil"]').click();
    cy.location("pathname").should("eq", "/perfil");
    cy.contains("Camila Vega").should("be.visible");

    // Cerrar sesión y loguear como Sofía
    cy.get('[data-testid="profile-logout-btn"]').click();
    cy.intercept("POST", "**/api/auth/login").as("loginSofia");
    cy.get('[data-testid="auth-email"]').type("sofia@ticketit.com");
    cy.get('[data-testid="auth-password"]').type("123456");
    cy.get('[data-testid="auth-submit-btn"]').click();
    cy.wait("@loginSofia").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/");
    cy.contains("Próximos eventos").should("be.visible");

    // Simular expiración del token JWT al intentar entrar a Mis Eventos
    cy.intercept(
      { method: "GET", url: "**/api/auth/me", times: 1 },
      {
        statusCode: 401,
        body: { error: "Token inválido o expirado" },
      }
    ).as("expiredMe");

    cy.get('[data-testid="header-swap-btn"]').click();
    cy.wait("@expiredMe");

    cy.get('[data-testid="session-expired-banner"]', { timeout: 15000 }).should(
      "be.visible"
    );
    cy.contains("Tu sesión venció").should("be.visible");
    cy.get('[data-testid="auth-submit-btn"]').should("be.visible");
    cy.contains(/token/i).should("not.exist");

    // Volver a loguear como Sofía y verificar redirección automática cuando el 401 ocurre dentro del chat
    cy.intercept("GET", "**/api/auth/me", (req) => {
      req.continue();
    });
    cy.intercept("POST", "**/api/auth/login").as("reloginSofia");
    cy.get('[data-testid="auth-email"]').clear().type("sofia@ticketit.com");
    cy.get('[data-testid="auth-password"]').clear().type("123456");
    cy.get('[data-testid="auth-submit-btn"]').click();
    cy.wait("@reloginSofia").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/");

    cy.get('[data-testid="tab-mensajes"]').click();
    cy.location("pathname").should("eq", "/mensajes");
    cy.intercept("GET", "**/api/compras/*", {
      statusCode: 401,
      body: { error: "Token inválido o expirado" },
    }).as("expiredChat");

    cy.get('[data-testid="conv-item-5"]').should("be.visible").click();
    cy.wait("@expiredChat");

    cy.location("pathname").should("eq", "/perfil");
    cy.get('[data-testid="session-expired-banner"]', { timeout: 15000 }).should(
      "be.visible"
    );
    cy.contains("Tu sesión venció").should("be.visible");
    cy.contains(/token/i).should("not.exist");
  });
});
