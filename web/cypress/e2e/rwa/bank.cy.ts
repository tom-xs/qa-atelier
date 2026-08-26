import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";
import { RWAHomePage } from "../../pages/rwa/RwaHomePage";
import { RwaBankAccountPage } from "../../pages/rwa/RwaBankAccountPage";

describe("[REQ-BANK-001] RWA — Bank Account", () => {
  const loginPage = new RwaLoginPage();
  const homePage = new RWAHomePage();
  const bankAccountPage = new RwaBankAccountPage();

  const getCredentials = () => {
    const username = Cypress.env("RWA_USER") || "Heath93";
    const password = Cypress.env("RWA_PASS") || "s3cret";

    return { username, password };
  };

  beforeEach(() => {
    const { username, password } = getCredentials();
    loginPage.login(username, password);
  });

  it("[TC-009] Link a new bank account", () => {
    // Arrange
    const bankName = `Test Bank ${Date.now()}`;
    const routingNumber = "123456789";
    const accountNumber = "987654321";

    // Act
    homePage.openBankAccounts();
    bankAccountPage.createAccount(bankName, routingNumber, accountNumber);

    // Assert
    cy.location("pathname").should("eq", "/bankaccounts");
    bankAccountPage.getAccountItem(bankName).should("exist");
  });
});
