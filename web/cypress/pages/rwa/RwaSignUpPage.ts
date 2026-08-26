import { RWAHomePage } from "./RwaHomePage";

export class RwaSignUpPage {
  visit() {
    cy.visit("/signup");
  }

  enterFirstName(firstName: string) {
    cy.getBySel("signup-first-name").find("input").clear().type(firstName);
  }

  enterLastName(lastName: string) {
    cy.getBySel("signup-last-name").find("input").clear().type(lastName);
  }

  enterUsername(username: string) {
    cy.getBySel("signup-username").find("input").clear().type(username);
  }

  enterPassword(password: string) {
    cy.getBySel("signup-password").find("input").clear().type(password);
  }

  enterConfirmPassword(password: string) {
    cy.getBySel("signup-confirmPassword").find("input").clear().type(password);
  }

  submit() {
    cy.getBySel("signup-submit").click();
  }

  signUp(
    firstName: string,
    lastName: string,
    username: string,
    password: string
  ) {
    this.enterFirstName(firstName);
    this.enterLastName(lastName);
    this.enterUsername(username);
    this.enterPassword(password);
    this.enterConfirmPassword(password);
    this.submit();
    return new RWAHomePage();
  }
}
