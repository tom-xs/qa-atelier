import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";
import { RwaSignUpPage } from "../../pages/rwa/RwaSignUpPage";

describe("[REQ-AUTH-004] RWA — Sign Up", () => {
  const signUpPage = new RwaSignUpPage();
  const loginPage = new RwaLoginPage();

  beforeEach(() => {
    signUpPage.visit();
  });

  it("[TC-007] Sign up creates a new account", () => {
    // Arrange
    const uniqueUsername = `TC007_${Date.now()}`;
    const password = "s3cret";

    // Act
    signUpPage.signUp("TC007", "Test", uniqueUsername, password);

    // Assert: the app redirects to the sign-in page after signup;
    // logging in with the freshly created account proves it exists.
    cy.location("pathname").should("eq", "/signin");
    loginPage.login(uniqueUsername, password);

    cy.location("pathname").should("eq", "/");
    cy.getCookie("connect.sid").should("exist");
    cy.getBySel("nav-top-notifications-count").should("exist");
  });
});
