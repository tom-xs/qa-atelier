import { RWAHomePage } from "../../pages/rwa/RwaHomePage";
import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";
import { RwaTransactionPage } from "../../pages/rwa/RwaTransactionPage";

describe("[REQ-TX-001] RWA — Transaction", () => {
  const loginPage = new RwaLoginPage();
  const homePage = new RWAHomePage();
  const transactionPage = new RwaTransactionPage();

  const getCredentials = () => {
    const username = Cypress.env("RWA_USER");
    const password = Cypress.env("RWA_PASS");

    if (typeof username !== "string" || username.length === 0) {
      throw new Error("RWA_USER is required to run RWA auth tests.");
    }
    if (typeof password !== "string" || password.length === 0) {
      throw new Error("RWA_PASS is required to run RWA auth tests.");
    }

    return { username, password };
  };

  beforeEach(() => {
    loginPage.visit();
    const { username, password } = getCredentials();
    loginPage.login(username, password);
  });

  it("[TC-002] Create a payment transaction", () => {
    // Arrange
    const targetContact = "Dina20";
    const transactionAmount = "100";
    const displayedAmount = "$100.00";
    const transactionMsg = "Test Transaction";
    cy.getBySel("sidenav-user-balance")
      .invoke("text")
      .then((balanceText) => {
        const initialBalance = parseFloat(balanceText.replace(/[$,]/g, ""));
        // Act
        homePage
          .startTransaction()
          .selectContact(targetContact)
          .defineTransaction(transactionAmount, transactionMsg)
          .clickPayButton();

        // Assert success notification displays
        cy.getBySel("alert-bar-success").should("exist");

        transactionPage.clickReturnToTransactionsBtn();

        // Assert transaction appears on transactions feed
        transactionPage
          .getTransactionItem(displayedAmount, transactionMsg)
          .should("exist");

        // Assert new balance is Initial Balance - Transaction Amount
        cy.getBySel("sidenav-user-balance")
          .invoke("text")
          .then((newBalanceText) => {
            const newBalance = parseFloat(newBalanceText.replace(/[$,]/g, ""));
            expect(newBalance).to.equal(
              initialBalance - Number(transactionAmount),
            );
          });
      });
  });
});
