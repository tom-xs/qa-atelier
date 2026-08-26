import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";
import { RwaTransactionPage } from "../../pages/rwa/RwaTransactionPage";

describe("[REQ-TX-003] RWA — Transaction feeds", () => {
  const loginPage = new RwaLoginPage();
  const transactionPage = new RwaTransactionPage();
  const apiUrl = Cypress.env("API_URL") || "http://localhost:3001";

  const getCredentials = () => {
    const username = Cypress.env("RWA_USER");
    const password = Cypress.env("RWA_PASS");

    if (typeof username !== "string" || username.length === 0) {
      throw new Error("RWA_USER is required to run RWA feed tests.");
    }
    if (typeof password !== "string" || password.length === 0) {
      throw new Error("RWA_PASS is required to run RWA feed tests.");
    }

    return { username, password };
  };

  beforeEach(() => {
    // Arrange: intercept the three feed endpoints. Order matters — the broad
    // /transactions* alias is registered first, then the more specific
    // /transactions/public* and /transactions/contacts* aliases override it.
    cy.intercept("GET", `${apiUrl}/transactions*`).as("personalTransactions");
    cy.intercept("GET", `${apiUrl}/transactions/public*`).as("publicTransactions");
    cy.intercept("GET", `${apiUrl}/transactions/contacts*`).as("contactsTransactions");

    const { username, password } = getCredentials();
    loginPage.login(username, password);
  });

  it("[TC-011] Feeds filter Mine / Friends / Public correctly", () => {
    // Assert — Everyone / Public is the default landing route after login
    cy.location("pathname").should("eq", "/");
    assertFeedRenders("@publicTransactions");

    // Act & Assert — Friends / Contacts
    transactionPage.clickContactsTab();
    cy.location("pathname").should("eq", "/contacts");
    assertFeedRenders("@contactsTransactions");

    // Act & Assert — Mine / Personal
    transactionPage.clickPersonalTab();
    cy.location("pathname").should("eq", "/personal");
    assertFeedRenders("@personalTransactions");
  });
});

function assertFeedRenders(alias: string) {
  cy.wait(alias)
    .its("response.body.results")
    .should("be.an", "array")
    .and("have.length.greaterThan", 0)
    .then((results: Array<{ id: string }>) => {
      const ids = results.map((transaction) => transaction.id);

      cy.getBySel("transaction-list")
        .find('[data-test^="transaction-item-"]')
        .should("have.length", ids.length);

      ids.forEach((id) => {
        cy.getBySel(`transaction-item-${id}`).should("exist");
      });
    });
}
