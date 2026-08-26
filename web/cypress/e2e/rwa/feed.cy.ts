import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";
import { RwaTransactionPage } from "../../pages/rwa/RwaTransactionPage";
import { getApiUrl, getUserCredentials } from "../../support/rwa-auth";

describe("[REQ-TX-003] RWA — Transaction feeds", () => {
  const loginPage = new RwaLoginPage();
  const transactionPage = new RwaTransactionPage();

  beforeEach(() => {
    const apiUrl = getApiUrl();

    // Arrange: intercept the three feed endpoints. Order matters — the broad
    // /transactions* alias is registered first, then the more specific
    // /transactions/public* and /transactions/contacts* aliases override it
    // (Cypress matches intercepts in reverse registration order).
    cy.intercept("GET", `${apiUrl}/transactions*`).as("personalTransactions");
    cy.intercept("GET", `${apiUrl}/transactions/public*`).as("publicTransactions");
    cy.intercept("GET", `${apiUrl}/transactions/contacts*`).as("contactsTransactions");

    const { username, password } = getUserCredentials();
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
    // Extraction (not a computed assertion): the response IDs drive the
    // follow-up per-item commands below, each of which retries on its own.
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
