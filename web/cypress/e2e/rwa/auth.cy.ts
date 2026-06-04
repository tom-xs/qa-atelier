import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";

describe("RWA — Authentication", () => {
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

  it("logs in successfully with valid credentials", () => {
    // Arrange
    const { username, password } = getCredentials();

    // Act
    loginPage.login(username, password);

    // Assert
    cy.location("pathname").should("eq", "/");
    cy.getBySel("nav-top-notifications-count").should("exist");
  });

  it("shows an error for an incorrect password", () => {
    // Act
    const { username } = getCredentials();
    loginPage.login(username, "wrongpassword");

    // Assert
    cy.getBySel("signin-error").should("be.visible");
  });

  it("blocks login with empty fields", () => {
    // Act
    cy.getBySel("signin-submit").click();

    // Assert
    cy.getBySel("signin-username")
      .find("username-helper-text")
      .should("not.be.empty");
  });

  it("doesn't display error message by default", () => {
    // Assert
    cy.get("#username-helper-text").should("not.exist");
  });
});
