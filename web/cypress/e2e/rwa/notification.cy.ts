import { RWAHomePage } from "../../pages/rwa/RwaHomePage";
import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";
import { RwaTransactionPage } from "../../pages/rwa/RwaTransactionPage";

describe("[REQ-NOTIF-001] RWA — Notifications", () => {
  const loginPage = new RwaLoginPage();
  const homePage = new RWAHomePage();
  const transactionPage = new RwaTransactionPage();

  const transactionAmount = "50";
  const displayedAmount = "$50.00";

  const getUserCredentials = () => {
    const username = Cypress.env("RWA_USER");
    const password = Cypress.env("RWA_PASS");

    if (typeof username !== "string" || username.length === 0) {
      throw new Error("RWA_USER is required to run RWA notification tests.");
    }
    if (typeof password !== "string" || password.length === 0) {
      throw new Error("RWA_PASS is required to run RWA notification tests.");
    }

    return { username, password };
  };

  const getTargetUserCredentials = () => {
    const username = Cypress.env("RWA_TARGET_USER");
    const password = Cypress.env("RWA_TARGET_PASS");

    if (typeof username !== "string" || username.length === 0) {
      throw new Error("RWA_TARGET_USER is required to run RWA notification tests.");
    }
    if (typeof password !== "string" || password.length === 0) {
      throw new Error("RWA_TARGET_PASS is required to run RWA notification tests.");
    }

    return { username, password };
  };

  beforeEach(() => {
    loginPage.visit();
    const { username, password } = getUserCredentials();
    loginPage.login(username, password);
  });

  it("[TC-016] Notification appears for received request", () => {
    // Arrange
    const { username: targetUsername, password: targetPassword } =
      getTargetUserCredentials();
    const requestNote = `TC-016 request ${Date.now()}`;

    cy.getBySel("sidenav-user-full-name")
      .invoke("text")
      .then((text) => text.trim())
      .as("requesterName");

    // Act: request money from another user
    homePage
      .startTransaction()
      .selectContact(targetUsername)
      .defineTransaction(transactionAmount, requestNote)
      .clickRequestBtn();

    cy.getBySel("alert-bar-success").should("be.visible");
    transactionPage.clickReturnToTransactionsBtn();

    // Assert: recipient sees a pending request notification
    homePage.logout();
    loginPage.login(targetUsername, targetPassword);
    homePage.openNotifications();

    cy.get<string>("@requesterName").then((requesterName) => {
      cy.getBySel("notifications-list")
        .find(`:contains("${requesterName}"):contains("requested")`)
        .should("be.visible");
    });
  });
});
