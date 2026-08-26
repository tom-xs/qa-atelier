export class RwaBankAccountPage {
  visit() {
    cy.visit("/bankaccounts");
    return this;
  }

  clickCreate() {
    cy.getBySel("bankaccount-new").click();
    return this;
  }

  enterBankName(bankName: string) {
    cy.getBySel("bankaccount-bankName-input").find("input").clear().type(bankName);
    return this;
  }

  enterRoutingNumber(routingNumber: string) {
    cy.getBySel("bankaccount-routingNumber-input")
      .find("input")
      .clear()
      .type(routingNumber);
    return this;
  }

  enterAccountNumber(accountNumber: string) {
    cy.getBySel("bankaccount-accountNumber-input")
      .find("input")
      .clear()
      .type(accountNumber);
    return this;
  }

  fillForm(bankName: string, routingNumber: string, accountNumber: string) {
    this.enterBankName(bankName);
    this.enterRoutingNumber(routingNumber);
    this.enterAccountNumber(accountNumber);
    return this;
  }

  submit() {
    cy.getBySel("bankaccount-submit").click();
    return this;
  }

  createAccount(bankName: string, routingNumber: string, accountNumber: string) {
    this.clickCreate();
    this.fillForm(bankName, routingNumber, accountNumber);
    this.submit();
    return this;
  }

  getAccountList() {
    return cy.getBySel("bankaccount-list");
  }

  getAccountItem(bankName: string) {
    return this.getAccountList().contains(bankName);
  }
}
