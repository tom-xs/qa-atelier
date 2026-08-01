import { assert } from "chai";
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
      throw new Error("CYPRESS_RWA_USER is required to run RWA auth tests.");
    }
    if (typeof password !== "string" || password.length === 0) {
      throw new Error("CYPRESS_RWA_PASS is required to run RWA auth tests.");
    }

    return { username, password };
  };

  beforeEach(() => {
    loginPage.visit();
    const { username, password } = getCredentials();
    loginPage.login(username, password);
  });

  it("Is able to make a valid transaction", () => {
    // Arrange
    const targetContact = "Dina20";
    const transactionAmount = "$100";
    const transactionMsg = "Test Transaction";
    homePage.clickTransactionButton();

    // Act
    transactionPage.selectContact(targetContact);
    transactionPage.defineTransaction(transactionAmount, transactionMsg);
    transactionPage.clickPayButton();
    transactionPage.clickReturnToTransactions();

    // Assert
    transactionPage.searchTransaction(transactionAmount, transactionMsg);
  });
});
