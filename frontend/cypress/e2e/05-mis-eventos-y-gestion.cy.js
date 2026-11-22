describe("05 - Mis Eventos, estado vacío, creación y confirmación por lote", () => {
  it("muestra estado vacío para usuario sin eventos y permite crear y gestionar compras como organizador", () => {
    // 1. Mateo aún no tiene eventos
    cy.loginUI("mateo@ticketit.com", "123456");
    cy.get('[data-testid="header-swap-btn"]').click();
    cy.location("pathname").should("eq", "/mis-eventos");
    cy.contains("Todavía no creaste tu primer evento").should("be.visible");
    cy.contains("deshabilitar este botón en Perfil").should("be.visible");

    // 2. Sofía publica un evento y gestiona compras pendientes
    cy.loginUI("sofia@ticketit.com", "123456");
    cy.get('[data-testid="header-swap-btn"]').click();
    cy.location("pathname").should("eq", "/mis-eventos");
    cy.contains("AI & Software Summit").should("be.visible");

    // Crear un nuevo evento
    cy.get('[data-testid="create-event-btn"]').click();
    const nombreEvento = `Jazz Night E2E ${Date.now()}`;
    cy.get('[data-testid="create-nombre"]').type(nombreEvento);
    cy.get('[data-testid="create-descripcion"]').type("Sesión de jazz en vivo creada en Cypress");
    cy.get('[data-testid="publish-event-btn"]').click();

    cy.contains(nombreEvento, { timeout: 15000 }).should("be.visible");

    // Ir al chat como Sofía para usar el atajo del banner superior directo al panel de gestión
    cy.visit("/");
    cy.get('[data-testid="tab-mensajes"]').click();
    cy.location("pathname").should("eq", "/mensajes");
    cy.get('[data-testid="conv-item-6"]').should("be.visible").click();
    cy.get('[data-testid="chat-event-banner"]').should("be.visible").click();
    cy.location("pathname").should("eq", "/gestionar-evento/5");

    // Confirmar compra pendiente, luego cancelar la confirmada (sin botón "Marcar utilizada")
    cy.contains("Disponibilidad por tipo de entrada").should("be.visible");
    cy.get('[data-testid="gestion-compra-6"]').click();
    cy.get('[data-testid="batch-confirm-btn"]').click();
    cy.contains("CONFIRMADA").should("be.visible");

    cy.get('[data-testid="gestion-compra-6"]').click();
    cy.contains("Marcar utilizada").should("not.exist");
    cy.get('[data-testid="batch-cancel-btn"]').should("be.visible").click();
    cy.contains("CANCELADA").should("be.visible");

    cy.get('[data-testid="gestion-compra-6"]').click();
    cy.get('[data-testid="batch-refund-btn"]').should("be.visible");
  });
});
