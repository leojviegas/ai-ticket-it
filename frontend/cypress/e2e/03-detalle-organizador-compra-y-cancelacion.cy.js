describe("03 - Detalle, Perfil del Organizador, Compra, Seguimiento y Cancelación", () => {
  it("recorre el perfil del organizador, selector con tacho de basura, compra y cancelación", () => {
    cy.loginUI("mateo@ticketit.com", "123456");

    // Abrir Festival Indie Primavera (organizado por Lucas Fernández)
    cy.contains("Festival Indie Primavera").click();
    cy.contains("Experiencias previas con este organizador").should("not.exist");
    cy.get('[data-testid="organizer-card"]').should("be.visible").click();

    // Perfil del Organizador muestra eventos con su imagen y las experiencias previas debajo
    cy.get('[data-testid="organizer-profile-root"]')
      .should("be.visible")
      .within(() => {
        cy.contains("Lucas Fernández").should("be.visible");
        cy.contains("Noche Acústica 2025").should("be.visible");
        cy.contains("Festival Indie Primavera").should("be.visible");

        cy.get('[data-testid="organizer-reviews-section"]').should("be.visible");
        cy.contains("Experiencias previas con este organizador").should("be.visible");
        cy.contains("Sonido impecable").should("be.visible");

        // Evento pasado tiene compra deshabilitada y reseñas visibles
        cy.contains("Noche Acústica 2025").click();
      });
    cy.location("pathname").should("eq", "/evento/1");
    cy.get('[data-testid="event-detail-root-1"]')
      .should("be.visible")
      .within(() => {
        cy.contains("Evento finalizado (compra deshabilitada)").should("be.visible");
        cy.contains("Reseñas de este evento").should("be.visible");
        cy.contains("Sonido impecable").should("be.visible");
      });

    // Volver al evento futuro para probar selector + / tacho de basura y compra
    cy.visit("/");
    cy.contains("Festival Indie Primavera", { timeout: 20000 }).click();

    // Tipo de entrada 201 (General): sumar a 1, quitar con tacho (vuelve a 0), luego volver a sumar 1
    cy.get('[data-testid="ticket-plus-201"]').click();
    cy.get('[data-testid="ticket-minus-201"]').should("be.visible").click();
    cy.get('[data-testid="ticket-minus-201"]').should("not.exist");

    cy.get('[data-testid="ticket-plus-201"]').click();
    cy.intercept("POST", "**/api/compras").as("crearCompra");
    cy.get('[data-testid="buy-submit-btn"]').click();

    cy.wait("@crearCompra").then((interception) => {
      expect(interception.response.statusCode).to.eq(201);
      const compraId = interception.response.body.id;

      cy.contains("Reserva registrada como PENDIENTE").should("be.visible");
      cy.get('[data-testid="go-to-compras-btn"]').click();

      // Abrir Seguimiento de la compra
      cy.get(`[data-testid="compra-tracking-${compraId}"]`).click();
      cy.contains("Seguimiento de la compra").should("be.visible");
      cy.contains("¿Quién inició el cambio?").should("be.visible");
      cy.contains("Usuario").should("be.visible");
      // Cerrar bottom sheet tocando el backdrop
      cy.get('[data-testid="bottom-sheet-backdrop"]').click(20, 20);

      // Cancelar compra
      cy.get(`[data-testid="compra-cancel-${compraId}"]`).click();
      cy.get('[data-testid="confirm-cancel-btn"]').click();
      cy.contains("CANCELADA").should("be.visible");
    });
  });
});
