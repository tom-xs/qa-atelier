declare global {
  namespace Cypress {
    interface Chainable {
      getBySel(
        selector: string,
        ...args: any[]
      ): Chainable<JQuery<HTMLElement>>;
      getBySelLike(
        selector: string,
        ...args: any[]
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}

export {};
