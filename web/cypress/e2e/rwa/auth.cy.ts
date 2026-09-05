import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";
import { getUserCredentials } from "../../support/rwa-auth";

describe("[REQ-AUTH-001, REQ-AUTH-002, REQ-AUTH-003] RWA — Authentication", () => {
  const loginPage = new RwaLoginPage();

  beforeEach(() => {
    loginPage.visit();
  });

  it("[TC-022] logs in with valid credentials via the UI", () => {
    // Arrange
    const { username, password } = getUserCredentials();

    // Act
    loginPage.login(username, password);

    // Assert
    cy.location("pathname").should("eq", "/");
    cy.getCookie("connect.sid").should("exist");
    cy.getBySel("nav-top-notifications-count").should("exist");
  });

  it("[TC-004] User cannot log in with invalid credentials", () => {
    // Act
    const { username } = getUserCredentials();
    loginPage.login(username, "wrongpassword", false);

    // Assert
    cy.location("href").should("contain", "/signin");
    cy.getCookie("connect.sid").should("not.exist");
    cy.getBySel("signin-error").should("be.visible");
  });

  it("[TC-006] log out invalidates the session", () => {
    // Arrange
    const { username, password } = getUserCredentials();

    // Act
    const homePage = loginPage.login(username, password);
    homePage.logout();

    // Assert
    cy.location("pathname").should("eq", "/signin");
    cy.getCookie("connect.sid").should("not.exist");

    // A protected page cannot be accessed without re-logging in
    cy.visit("/");
    cy.location("pathname").should("eq", "/signin");
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
