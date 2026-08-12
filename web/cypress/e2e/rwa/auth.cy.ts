import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";

describe("[REQ-AUTH-001, REQ-AUTH-002] RWA — Authentication", () => {
  const loginPage = new RwaLoginPage();

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
  });

  it("[TC-022] logs in with valid credentials via the UI", () => {
    // Arrange
    const { username, password } = getCredentials();

    // Act
    loginPage.login(username, password);

    // Assert
    cy.location("pathname").should("eq", "/");
    cy.getCookie("connect.sid").should("exist");
    cy.getBySel("nav-top-notifications-count").should("exist");
  });

  it("[TC-004] User cannot log in with invalid credentials", () => {
    // Act
    const { username } = getCredentials();
    loginPage.login(username, "wrongpassword");

    // Assert
    cy.location("href").should("contain", "/signin");
    cy.getCookie("connect.sid").should("not.exist");
    cy.getBySel("signin-error").should("be.visible");
  });

  it("[TC-021] Client-side login validation blocks empty submission", () => {
    // Act
    cy.getBySel("signin-submit").click();

    // Assert
    cy.getBySel("signin-username")
      .find("#username-helper-text")
      .should("not.be.empty");
  });

  it("[TC-021] shows no error message before interaction", () => {
    // Assert
    cy.get("#username-helper-text").should("not.exist");
  });
});
