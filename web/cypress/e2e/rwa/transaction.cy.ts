import { RWAHomePage } from "../../pages/rwa/RwaHomePage";
import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";
import { RwaTransactionPage } from "../../pages/rwa/RwaTransactionPage";

describe("RWA — Transaction", () => {
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

  it("user is able to make a valid transaction", () => {
    // Arrange
    const targetContact = "Dina20";
    const transactionAmount = "100";
    const displayedAmount = "$100.00";
    const transactionMsg = "Test Transaction";

    // Act
    homePage
      .startTransaction()
      .selectContact(targetContact)
      .defineTransaction(transactionAmount, transactionMsg)
      .clickPayButton()
      .clickReturnToTransactionsBtn();

    // Assert
    transactionPage
      .getTransactionItem(displayedAmount, transactionMsg)
      .should("exist");
  });
});
