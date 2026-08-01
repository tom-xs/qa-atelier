export class RwaTransactionPage {
  selectContact(username: string) {
    cy.getBySel("user-list-search-input").type(username);
    cy.getBySelLike("user-list-item-").contains(username).click();
  }

  defineTransaction(amount: string, note: string) {
    cy.getBySel("transaction-create-amount-input").find("input").type(amount);
    cy.getBySel("transaction-create-description-input")
      .find("input")
      .type(note);
  }

  searchTransaction(amount: string, note: string) {
    cy.getBySel("transaction-list")
      .getBySelLike("transaction-item-")
      .filter(`:contains("${amount}"):contains("${note}")`)
      .should("exist");
  }

  clickRequestButton() {
    cy.getBySel("transaction-create-submit-request").click();
  }

  clickPayButton() {
    cy.getBySel("transaction-create-submit-payment").click();
  }

  clickReturnToTransactions() {
    cy.getBySel("new-transaction-return-to-transactions").click();
  }

  clickNewTransactionButton() {
    cy.getBySel("new-transaction-create-another-transaction").click();
  }
}
