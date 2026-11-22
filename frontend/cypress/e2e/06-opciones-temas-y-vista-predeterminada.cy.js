describe("06 - Opciones de tema, daltonismo e intercambio Mis Eventos predeterminado", () => {
  it("cambia tema, activa modo daltónico e intercambia Mis Eventos con Mis Compras", () => {
    cy.loginUI("sofia@ticketit.com", "123456");

    cy.get('[data-testid="tab-perfil"]').click();
    cy.get('[data-testid="profile-options-btn"]').click();

    // Cambio de tema Claro <-> Oscuro y modo daltónico
    cy.get('[data-testid="theme-dark-btn"]').click();
    cy.get('[data-testid="switch-colorblind"]').click();
    cy.get('[data-testid="theme-light-btn"]').click();

    // Activar "Elegir Mis Eventos como vista predeterminada"
    cy.get('[data-testid="switch-default-my-events"]').click();

    cy.visit("/");
    cy.get('[data-testid="tab-central"]').should("contain.text", "Mis Eventos");
    cy.get('[data-testid="header-swap-btn"]').click();
    cy.contains("Seguimiento de la compra").should("be.visible");

    // Desactivar vista predeterminada y ocultar el botón Mis Eventos
    cy.go("back");
    cy.get('[data-testid="tab-perfil"]').click();
    cy.get('[data-testid="profile-options-btn"]').click();
    cy.get('[data-testid="switch-default-my-events"]').click();
    cy.get('[data-testid="switch-show-my-events"]').click();

    cy.visit("/");
    cy.get('[data-testid="tab-central"]').should("contain.text", "Compras");
    cy.get('[data-testid="header-swap-btn"]').should("not.exist");
  });
});
