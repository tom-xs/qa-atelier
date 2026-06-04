declare global {
  namespace Cypress {
    interface Chainable {
      getBySel(
        selector: string,
        ...args: any[]
      ): Chainable<JQuery<HTMLElement>>;
      getBySelLike(
        selector: string,
        ...args: any[]
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}

Cypress.Commands.add("getBySel", (selector, ...args) => {
  return cy.get(`[data-test=${selector}]`, ...args);
});

Cypress.Commands.add("getBySelLike", (selector, ...args) => {
  return cy.get(`[data-test*=${selector}]`, ...args);
});
