describe("01 - Catálogo público, búsqueda y filtros", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit("/");
    cy.get('[data-testid="search-input"]', { timeout: 30000 }).should("be.visible");
  });

  it("muestra únicamente eventos futuros por defecto y permite buscar y filtrar", () => {
    cy.contains("Festival Indie Primavera").should("be.visible");
    cy.contains("AI & Software Summit").should("be.visible");
    cy.contains("Noche Acústica 2025").should("not.exist");

    // Búsqueda textual
    cy.get('[data-testid="search-input"]').type("Summit");
    cy.contains("AI & Software Summit").should("be.visible");
    cy.contains("Festival Indie Primavera").should("not.exist");

    cy.get('[data-testid="search-input"]').clear();
    cy.contains("Festival Indie Primavera").should("be.visible");

    // Filtro por categoría
    cy.contains("Festivales").click();
    cy.contains("Festival Indie Primavera").should("be.visible");
    cy.contains("AI & Software Summit").should("not.exist");

    cy.contains("Todas").click();
    cy.contains("AI & Software Summit").should("be.visible");

    // Modal de filtros: orden por precio y rango máximo
    cy.get('[data-testid="open-filters-btn"]').click();
    cy.get('[data-testid="sort-precio"]').click();
    cy.get('[data-testid="filter-price-max"]').clear().type("10000");
    cy.get('[data-testid="apply-filters-btn"]').click();

    cy.contains("Copa Ciudad Nocturna").should("be.visible");
    cy.contains("Festival Indie Primavera").should("not.exist");

    // Limpiar filtros
    cy.get('[data-testid="open-filters-btn"]').click();
    cy.get('[data-testid="reset-filters-btn"]').click();
    cy.contains("Festival Indie Primavera").should("be.visible");
  });
});
