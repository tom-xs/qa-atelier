import { RwaTransactionPage } from "./RwaTransactionPage";

export class RWAHomePage {
  startTransaction() {
    cy.getBySel("nav-top-new-transaction").click();
    return new RwaTransactionPage();
  }
}
