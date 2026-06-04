import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";

describe("RWA — Authentication", () => {
  const loginPage = new RwaLoginPage();

  beforeEach(() => {
    loginPage.visit();
  });

  it("logs in successfully with valid credentials", () => {
    // Arrange
    const username = "Heath93";
    const password = "REDACTED";

    // Act
    loginPage.login(username, password);

    // Assert
    cy.location("pathname").should("eq", "/");
    cy.getBySel("nav-top-notifications-count").should("exist");
  });

  it("shows an error for an incorrect password", () => {
    // Act
    loginPage.login("Heath93", "wrongpassword");

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
