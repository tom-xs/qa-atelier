export class RwaLoginPage {
  visit() {
    cy.visit("/");
  }

  enterUsername(username: string) {
    cy.getBySel("signin-username").find("input").clear().type(username);
  }

  enterPassword(password: string) {
    cy.getBySel("signin-password").find("input").clear().type(password);
  }

  submit() {
    cy.getBySel("signin-submit").click();
  }

  login(username: string, password: string) {
    this.visit();
    this.enterUsername(username);
    this.enterPassword(password);
    this.submit();
  }
}
