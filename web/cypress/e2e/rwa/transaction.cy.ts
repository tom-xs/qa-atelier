import { RWAHomePage } from "../../pages/rwa/RwaHomePage";
import { RwaLoginPage } from "../../pages/rwa/RwaLoginPage";
import { RwaTransactionPage } from "../../pages/rwa/RwaTransactionPage";
import {
  getApiUrl,
  getTargetUserCredentials,
  getUserCredentials,
} from "../../support/rwa-auth";

describe("[REQ-TX-001] RWA — Transaction", () => {
  const loginPage = new RwaLoginPage();
  const homePage = new RWAHomePage();
  const transactionPage = new RwaTransactionPage();

  const transactionAmount = "100";
  const displayedAmount = "$100.00";
  const transactionMsg = "Test Transaction";

  beforeEach(() => {
    // Start from a clean session state. Firefox in CI can keep the previous
    // spec's session alive (observed as a 401 on /login and a missing feed).
    cy.clearAllCookies();
    cy.clearAllLocalStorage();
    cy.clearAllSessionStorage();

    // KNOWN APP BUG (qa-atelier#45): the XState feed machines can race during
    // initialisation on Firefox and throw "transactions is undefined". This
    // does not affect the final rendered state, so suppress only that error
    // for this spec. Remove once the app defect is fixed.
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes("transactions is undefined") ||
        err.message.includes('can\'t access property "length", transactions is undefined')
      ) {
        return false;
      }
      return true;
    });

    cy.visit("/signin");
    cy.location("pathname").should("eq", "/signin");
    const { username, password } = getUserCredentials();
    loginPage.login(username, password);
  });

  it("[TC-002] Create a payment transaction", () => {
    // Arrange
    const {
      username: targetUsername,
      password: targetUserPassword,
    } = getTargetUserCredentials();
    const { username: senderUsername, password: senderPassword } =
      getUserCredentials();

    cy.intercept("GET", `${getApiUrl()}/transactions/public*`).as("transactionsFeed");

    cy.getBySel("sidenav-user-balance")
      .invoke("text")
      .then((text) => parseFloat(text.replace(/[$,]/g, "")))
      .as("senderInitialBalance");

    // Capture receiver initial balance from their account
    homePage.logout();
    loginPage.login(targetUsername, targetUserPassword);
    cy.getBySel("sidenav-user-balance")
      .invoke("text")
      .then((text) => parseFloat(text.replace(/[$,]/g, "")))
      .as("receiverInitialBalance");

    // Return to sender account to perform the payment
    homePage.logout();
    loginPage.login(senderUsername, senderPassword);

    // Act
    homePage
      .startTransaction()
      .selectContact(targetUsername)
      .defineTransaction(transactionAmount, transactionMsg)
      .clickPayButton();

    // Assert success notification displays
    cy.getBySel("alert-bar-success").should("be.visible");

    transactionPage.clickReturnToTransactionsBtn();
    cy.wait("@transactionsFeed");

    // Assert transaction appears on transactions feed
    transactionPage
      .getTransactionItem(displayedAmount, transactionMsg)
      .should("exist");

    // Assert sender balance decreased by the transaction amount
    cy.get<number>("@senderInitialBalance").then((initialBalance) => {
      cy.getBySel("sidenav-user-balance")
        .invoke("text")
        .should((newBalanceText) => {
          const newBalance = parseFloat(newBalanceText.replace(/[$,]/g, ""));
          expect(newBalance).to.be.closeTo(
            initialBalance - Number(transactionAmount),
            0.01
          );
        });
    });

    // Assert receiver balance increased by the transaction amount
    homePage.logout();
    loginPage.login(targetUsername, targetUserPassword);
    cy.get<number>("@receiverInitialBalance").then((initialBalance) => {
      cy.getBySel("sidenav-user-balance")
        .invoke("text")
        .should((newBalanceText) => {
          const newBalance = parseFloat(newBalanceText.replace(/[$,]/g, ""));
          expect(newBalance).to.be.closeTo(
            initialBalance + Number(transactionAmount),
            0.01
          );
        });
    });
  });

  it("[TC-003] Request money from another user", () => {
    // Arrange
    const { username: targetUserAccount, password: targetUserPassword } =
      getTargetUserCredentials();

    cy.intercept("GET", `${getApiUrl()}/transactions/public*`).as("requestMade");

    cy.getBySel("sidenav-user-full-name")
      .invoke("text")
      .then((text) => text.trim())
      .as("requesterName");

    // Act
    homePage
      .startTransaction()
      .selectContact(targetUserAccount)
      .defineTransaction(transactionAmount, transactionMsg)
      .clickRequestBtn();

    // Assert success notification displays
    cy.getBySel("alert-bar-success").should("be.visible");

    transactionPage.clickReturnToTransactionsBtn();
    cy.wait("@requestMade");

    // Assert transaction request appears on transactions feed
    transactionPage
      .getTransactionItem(displayedAmount, transactionMsg)
      .should("exist");

    // Assert notification appears on requested user account
    homePage.logout();
    loginPage.login(targetUserAccount, targetUserPassword).openNotifications();

    cy.getBySel("notifications-list").as("notificationsList");
    cy.get<string>("@requesterName").then((requesterName) => {
      cy.get("@notificationsList")
        .find(`:contains("${requesterName}"):contains("requested payment")`)
        .should("be.visible");
    });
  });

  it("[TC-015] Like and comment on a transaction", () => {
    // Arrange
    const commentText = `TC-015 comment ${Date.now()}`;

    cy.intercept("GET", `${getApiUrl()}/transactions/*`).as("transactionDetail");
    cy.intercept("POST", `${getApiUrl()}/comments/*`).as("postComment");

    // Act: open the first transaction in the public feed
    // The beforeEach already logs in and lands on /, so we avoid an extra
    // cy.visit here. On Firefox a fresh visit can race with the auth session
    // and return 401, leaving the feed empty.
    cy.location("pathname").should("eq", "/");

    // Ensure the feed has rendered at least one transaction before interacting
    cy.getBySel("transaction-list", { timeout: 10000 })
      .find('[data-test^="transaction-item-"]')
      .should("have.length.at.least", 1)
      .first()
      .then(($item) => {
        const transactionId = $item.attr("data-test")?.replace("transaction-item-", "");
        cy.wrap(transactionId).as("likedTransactionId");
      });

    cy.get<string>("@likedTransactionId").then((transactionId) => {
      cy.getBySel(`transaction-item-${transactionId}`).scrollIntoView().click({ force: true });
      cy.location("pathname").should("eq", `/transaction/${transactionId}`);
      cy.wait("@transactionDetail");
      // The XState-hydrated detail view can render blank on Firefox; a single
      // reload re-hydrates the page and reliably renders the header.
      cy.reload();
      cy.wait("@transactionDetail");
      cy.getBySel("transaction-detail-header", { timeout: 10000 })
        .should("exist")
        .and("be.visible");

      // Capture initial like count
      cy.getBySel(`transaction-like-count-${transactionId}`)
        .invoke("text")
        .then((text) => parseInt(text.trim(), 10))
        .as("initialLikeCount");

      // Act: like the transaction
      cy.getBySel(`transaction-like-button-${transactionId}`).click();

      // Assert: like count increased and button is disabled
      cy.get<number>("@initialLikeCount").then((initialLikeCount) => {
        cy.getBySel(`transaction-like-count-${transactionId}`).should(
          "contain.text",
          initialLikeCount + 1
        );
      });
      cy.getBySel(`transaction-like-button-${transactionId}`).should("be.disabled");

      // Act: add a comment
      cy.getBySel(`transaction-comment-input-${transactionId}`)
        .type(`${commentText}{enter}`);
      cy.wait("@postComment");

      // Assert: comment appears in the list
      cy.getBySel("comments-list")
        .find("[data-test^='comment-list-item-']")
        .should("contain.text", commentText);
    });
  });

  it("[TC-012] Recipient accepts a money request", () => {
    // Arrange
    const { username: requesterUsername, password: requesterPassword } =
      getUserCredentials();
    const { username: recipientUsername, password: recipientPassword } =
      getTargetUserCredentials();

    const requestAmount = "100";
    const displayedAmount = "$100.00";
    const requestNote = `TC-012 request ${Date.now()}`;

    cy.intercept("GET", `${getApiUrl()}/transactions/public*`).as("publicFeed");

    // Capture requester initial balance
    cy.getBySel("sidenav-user-balance")
      .invoke("text")
      .then((text) => parseFloat(text.replace(/[$,]/g, "")))
      .as("requesterInitialBalance");

    // Capture recipient initial balance
    homePage.logout();
    loginPage.login(recipientUsername, recipientPassword);
    cy.getBySel("sidenav-user-balance")
      .invoke("text")
      .then((text) => parseFloat(text.replace(/[$,]/g, "")))
      .as("recipientInitialBalance");

    // Act: requester creates a money request
    homePage.logout();
    loginPage.login(requesterUsername, requesterPassword);

    homePage
      .startTransaction()
      .selectContact(recipientUsername)
      .defineTransaction(requestAmount, requestNote)
      .clickRequestBtn();

    // Assert request creation succeeded
    cy.getBySel("alert-bar-success").should("be.visible");

    transactionPage.clickReturnToTransactionsBtn();
    cy.wait("@publicFeed");

    // Assert the pending request appears in the feed and capture its id
    transactionPage
      .getTransactionItem(displayedAmount, requestNote)
      .should("exist")
      .invoke("attr", "data-test")
      .then((dataTest) => {
        const requestId = dataTest?.replace("transaction-item-", "");
        cy.wrap(requestId).as("requestId");
      });

    // Act: recipient opens the request and accepts it
    homePage.logout();
    loginPage.login(recipientUsername, recipientPassword);
    cy.location("pathname").should("eq", "/");

    cy.get<string>("@requestId").then((requestId) => {
      cy.visit(`/transaction/${requestId}`);
      cy.getBySel("transaction-detail-header").should("be.visible");
      cy.getBySel(`transaction-accept-request-${requestId}`)
        .should("be.visible")
        .click();
    });

    // Assert the request is no longer pending (accept button gone, status changed)
    cy.get<string>("@requestId").then((requestId) => {
      cy.getBySel(`transaction-accept-request-${requestId}`).should("not.exist");
      cy.getBySel(`transaction-action-${requestId}`).should(
        "contain.text",
        "charged"
      );
    });

    // Assert recipient balance decreased by the requested amount
    homePage.logout();
    loginPage.login(recipientUsername, recipientPassword);

    cy.get<number>("@recipientInitialBalance").then((initialBalance) => {
      cy.getBySel("sidenav-user-balance", { timeout: 10000 })
        .invoke("text")
        .should((newBalanceText) => {
          const newBalance = parseFloat(newBalanceText.replace(/[$,]/g, ""));
          expect(newBalance).to.be.closeTo(
            initialBalance - Number(requestAmount),
            0.01
          );
        });
    });

    // Assert requester balance increased by the requested amount
    homePage.logout();
    loginPage.login(requesterUsername, requesterPassword);

    cy.get<number>("@requesterInitialBalance").then((initialBalance) => {
      cy.getBySel("sidenav-user-balance", { timeout: 10000 })
        .invoke("text")
        .should((newBalanceText) => {
          const newBalance = parseFloat(newBalanceText.replace(/[$,]/g, ""));
          expect(newBalance).to.be.closeTo(
            initialBalance + Number(requestAmount),
            0.01
          );
        });
    });

    // Assert the completed payment appears in the feed
    cy.visit("/");
    cy.wait("@publicFeed");
    cy.get<string>("@requestId").then((requestId) => {
      cy.getBySel(`transaction-item-${requestId}`).should("exist");
      cy.getBySel(`transaction-action-${requestId}`).should(
        "contain.text",
        "charged"
      );
    });
  });

  it("[TC-013] Recipient rejects a money request", () => {
    // Arrange
    const { username: requesterUsername, password: requesterPassword } =
      getUserCredentials();
    const { username: recipientUsername, password: recipientPassword } =
      getTargetUserCredentials();

    const requestAmount = "100";
    const displayedAmount = "$100.00";
    const requestNote = `TC-013 request ${Date.now()}`;

    cy.intercept("GET", `${getApiUrl()}/transactions/public*`).as("publicFeed");

    // Act: requester creates a money request
    homePage.logout();
    loginPage.login(requesterUsername, requesterPassword);

    homePage
      .startTransaction()
      .selectContact(recipientUsername)
      .defineTransaction(requestAmount, requestNote)
      .clickRequestBtn();

    // Assert request creation succeeded
    cy.getBySel("alert-bar-success").should("be.visible");

    transactionPage.clickReturnToTransactionsBtn();
    cy.wait("@publicFeed");

    // Assert the pending request appears in the feed and capture its id
    transactionPage
      .getTransactionItem(displayedAmount, requestNote)
      .should("exist")
      .invoke("attr", "data-test")
      .then((dataTest) => {
        const requestId = dataTest?.replace("transaction-item-", "");
        cy.wrap(requestId).as("requestId");
      });

    // Act: recipient opens the request and rejects it
    homePage.logout();
    loginPage.login(recipientUsername, recipientPassword);
    cy.location("pathname").should("eq", "/");

    cy.get<string>("@requestId").then((requestId) => {
      cy.visit(`/transaction/${requestId}`);
      cy.getBySel("transaction-detail-header").should("be.visible");
      cy.getBySel(`transaction-reject-request-${requestId}`)
        .should("be.visible")
        .click();
    });

    // Assert the request is no longer pending (action buttons gone)
    cy.get<string>("@requestId").then((requestId) => {
      cy.getBySel(`transaction-accept-request-${requestId}`).should("not.exist");
      cy.getBySel(`transaction-reject-request-${requestId}`).should("not.exist");

      // Verify the backend recorded the rejection (poll until settled; Firefox
      // can be slow to persist the status update).
      cy.request("GET", `${getApiUrl()}/transactions/${requestId}`)
        .its("body.transaction.requestStatus")
        .should("eq", "rejected");
    });
  });
});
