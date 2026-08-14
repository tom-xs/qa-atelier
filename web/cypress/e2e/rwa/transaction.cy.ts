import { RWAHomePage } from "../../pages/rwa/RwaHomePage";
import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";
import { RwaTransactionPage } from "../../pages/rwa/RwaTransactionPage";

describe("[REQ-TX-001] RWA — Transaction", () => {
  const loginPage = new RwaLoginPage();
  const homePage = new RWAHomePage();
  const transactionPage = new RwaTransactionPage();
  const apiUrl = Cypress.env("API_URL") || "http://localhost:3001";

  const transactionAmount = "100";
  const displayedAmount = "$100.00";
  const transactionMsg = "Test Transaction";

  const getTargetUserCredentials = () => {
    const username = Cypress.env("RWA_TARGET_USER");
    const password = Cypress.env("RWA_TARGET_PASS");

    if (typeof username !== "string" || username.length === 0) {
      throw new Error("RWA_TARGET_USER is required to run RWA transaction tests.");
    }
    if (typeof password !== "string" || password.length === 0) {
      throw new Error("RWA_TARGET_PASS is required to run RWA transaction tests.");
    }

    return { username, password };
  };

  const getUserCredentials = () => {
    const username = Cypress.env("RWA_USER");
    const password = Cypress.env("RWA_PASS");

    if (typeof username !== "string" || username.length === 0) {
      throw new Error("RWA_USER is required to run RWA transaction tests.");
    }
    if (typeof password !== "string" || password.length === 0) {
      throw new Error("RWA_PASS is required to run RWA transaction tests.");
    }

    return { username, password };
  };

  beforeEach(() => {
    loginPage.visit();
    const { username, password } = getUserCredentials();
    loginPage.login(username, password);
  });

  it("[TC-002] Create a payment transaction", () => {
    // Arrange
    const {
      username: targetUsername,
      password: targetUserPassword,
    } = getTargetUserCredentials();
    const { username: senderUsername, password: senderPassword } =
      getUserCredentials();

    cy.intercept("GET", `${apiUrl}/transactions/public*`).as("transactionsFeed");

    cy.getBySel("sidenav-user-balance")
      .invoke("text")
      .then((text) => parseFloat(text.replace(/[$,]/g, "")))
      .as("senderInitialBalance");

    // Capture receiver initial balance from their account
    homePage.logout();
    loginPage.login(targetUsername, targetUserPassword);
    cy.getBySel("sidenav-user-balance")
      .invoke("text")
      .then((text) => parseFloat(text.replace(/[$,]/g, "")))
      .as("receiverInitialBalance");

    // Return to sender account to perform the payment
    homePage.logout();
    loginPage.login(senderUsername, senderPassword);

    // Act
    homePage
      .startTransaction()
      .selectContact(targetUsername)
      .defineTransaction(transactionAmount, transactionMsg)
      .clickPayButton();

    // Assert success notification displays
    cy.getBySel("alert-bar-success").should("be.visible");

    transactionPage.clickReturnToTransactionsBtn();
    cy.wait("@transactionsFeed");

    // Assert transaction appears on transactions feed
    transactionPage
      .getTransactionItem(displayedAmount, transactionMsg)
      .should("exist");

    // Assert sender balance decreased by the transaction amount
    cy.get<number>("@senderInitialBalance").then((initialBalance) => {
      cy.getBySel("sidenav-user-balance")
        .invoke("text")
        .should((newBalanceText) => {
          const newBalance = parseFloat(newBalanceText.replace(/[$,]/g, ""));
          expect(newBalance).to.equal(initialBalance - Number(transactionAmount));
        });
    });

    // Assert receiver balance increased by the transaction amount
    homePage.logout();
    loginPage.login(targetUsername, targetUserPassword);
    cy.get<number>("@receiverInitialBalance").then((initialBalance) => {
      cy.getBySel("sidenav-user-balance")
        .invoke("text")
        .should((newBalanceText) => {
          const newBalance = parseFloat(newBalanceText.replace(/[$,]/g, ""));
          expect(newBalance).to.equal(initialBalance + Number(transactionAmount));
        });
    });
  });

  it("[TC-003] Request money from another user", () => {
    // Arrange
    const { username: targetUserAccount, password: targetUserPassword } =
      getTargetUserCredentials();

    cy.intercept("GET", `${apiUrl}/transactions/public*`).as("requestMade");

    cy.getBySel("sidenav-user-full-name")
      .invoke("text")
      .then((text) => text.trim())
      .as("requesterName");

    // Act
    homePage
      .startTransaction()
      .selectContact(targetUserAccount)
      .defineTransaction(transactionAmount, transactionMsg)
      .clickRequestBtn();

    // Assert success notification displays
    cy.getBySel("alert-bar-success").should("be.visible");

    transactionPage.clickReturnToTransactionsBtn();
    cy.wait("@requestMade");

    // Assert transaction request appears on transactions feed
    transactionPage
      .getTransactionItem(displayedAmount, transactionMsg)
      .should("exist");

    // Assert notification appears on requested user account
    homePage.logout();
    loginPage.login(targetUserAccount, targetUserPassword).openNotifications();

    cy.getBySel("notifications-list").as("notificationsList");
    cy.get<string>("@requesterName").then((requesterName) => {
      cy.get("@notificationsList")
        .find(`:contains("${requesterName}"):contains("requested payment")`)
        .should("be.visible");
    });
  });
});
