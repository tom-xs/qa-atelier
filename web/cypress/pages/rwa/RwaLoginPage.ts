import { RWAHomePage } from "./RwaHomePage";
import { RWANotificationPage } from "./RwaNotificationPage";

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

  openNotifications() {
    cy.getBySel("nav-top-notifications-link").click();
    return new RWANotificationPage();
  }

  login(username: string, password: string) {
    this.visit();
    this.enterUsername(username);
    this.enterPassword(password);
    this.submit();
    return new RWAHomePage();
  }
}
