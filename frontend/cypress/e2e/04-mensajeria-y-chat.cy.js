describe("04 - Mensajería interna, chat y ocultamiento local", () => {
  it("envía mensajes en una conversación y permite ocultar y restaurar chats", () => {
    cy.loginUI("sofia@ticketit.com", "123456");

    cy.get('[data-testid="tab-mensajes"]').click();
    cy.location("pathname").should("eq", "/mensajes");
    cy.get('[data-testid="conv-item-5"]').should("be.visible").click();

    const textoMensaje = `Consulta E2E ${Date.now()}`;
    cy.get('[data-testid="chat-input"]').type(textoMensaje);
    cy.get('[data-testid="chat-send-btn"]').click();
    cy.contains(textoMensaje).should("be.visible");

    // Volver a bandeja de mensajes y ocultar conversación de compra 5
    cy.visit("/");
    cy.get('[data-testid="tab-mensajes"]').click();
    cy.get('[data-testid="hide-conv-5"]').click();
    cy.get('[data-testid="hide-conv-5"]').should("not.exist");
    cy.get('[data-testid="restore-hidden-btn"]').should("be.visible");

    // Restaurar ocultos
    cy.get('[data-testid="restore-hidden-btn"]').click();
    cy.get('[data-testid="hide-conv-5"]').should("be.visible");
  });
});
