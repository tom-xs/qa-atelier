import { RwaLoginPage } from "./RwaLoginPage";
import { RWANotificationPage } from "./RwaNotificationPage";
import { RwaTransactionPage } from "./RwaTransactionPage";
import { RwaBankAccountPage } from "./RwaBankAccountPage";

export class RWAHomePage {
  startTransaction() {
    cy.getBySel("nav-top-new-transaction").click();
    // Wait for the new-transaction page to load before returning the page
    // object; otherwise the next command may run against the previous page.
    cy.location("pathname").should("eq", "/transaction/new");
    return new RwaTransactionPage();
  }

  openNotifications() {
    cy.getBySel("nav-top-notifications-link").click();
    return new RWANotificationPage();
  }

  openBankAccounts() {
    cy.getBySel("sidenav-bankaccounts").click();
    return new RwaBankAccountPage();
  }

  logout() {
    cy.getBySel("sidenav-signout").click();
    // Wait for the backend logout to complete and the app to redirect; Firefox
    // can otherwise race with the next login and reuse the previous session.
    cy.location("pathname").should("eq", "/signin");
    return new RwaLoginPage();
  }
}
