export class RwaTransactionPage {
  selectContact(username: string) {
    cy.getBySel("user-list-search-input").type(username);
    cy.getBySelLike("user-list-item-").contains(username).click();
    return this;
  }

  defineTransaction(amount: string, note: string) {
    cy.getBySel("transaction-create-amount-input").find("input").type(amount);
    cy.getBySel("transaction-create-description-input")
      .find("input")
      .type(note);
    return this;
  }

  getTransactionItem(amount: string, note: string) {
    return cy
      .getBySel("transaction-list")
      .find('[data-test^="transaction-item-"]')
      .filter(`:contains("${amount}"):contains("${note}")`);
  }

  clickRequestBtn() {
    cy.getBySel("transaction-create-submit-request").click();
    return this;
  }

  clickPayButton() {
    cy.getBySel("transaction-create-submit-payment").click();
    return this;
  }

  clickReturnToTransactionsBtn() {
    cy.getBySel("new-transaction-return-to-transactions").click();
    return this;
  }

  clickNewTransactionBtn() {
    cy.getBySel("new-transaction-create-another-transaction").click();
    return this;
  }
}
