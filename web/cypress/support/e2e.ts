// Custom commands go here
Cypress.Commands.add("getBySel", (selector: string) => {
  return cy.get(`[data-testid="${selector}"]`);
});
EOF;

cat > (support / index.d.ts) << "EOF";
declare namespace Cypress {
  interface Chainable {
    getBySel(selector: string): Chainable<JQuery<HTMLElement>>;
  }
}
