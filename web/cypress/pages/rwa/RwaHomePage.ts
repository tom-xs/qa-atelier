import { RwaLoginPage } from "./RwaLoginPage";
import { RWANotificationPage } from "./RwaNotificationPage";
import { RwaTransactionPage } from "./RwaTransactionPage";

export class RWAHomePage {
  startTransaction() {
    cy.getBySel("nav-top-new-transaction").click();
    return new RwaTransactionPage();
  }

  openNotifications() {
    cy.getBySel("nav-top-notifications-link").click();
    return new RWANotificationPage();
  }

  logout() {
    cy.getBySel("sidenav-signout").click();
    return new RwaLoginPage();
  }
}
