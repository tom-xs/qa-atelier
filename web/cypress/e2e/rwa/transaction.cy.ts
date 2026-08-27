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
    // Logging in via the API guarantees the session cookie is set correctly
    // regardless of any stale UI state.
    cy.clearCookies();
    const { username, password } = getUserCredentials();
    cy.request("POST", `${getApiUrl()}/login`, {
      username,
      password,
    }).then((res) => {
      const raw = res.headers["set-cookie"];
      const setCookie = Array.isArray(raw) ? raw[0] : (raw as string);
      const cookieValue = setCookie.split(";")[0].replace("connect.sid=", "");
      cy.setCookie("connect.sid", cookieValue);
    });
    cy.visit("/");
    cy.getBySel("nav-top-new-transaction").should("be.visible");
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
          expect(newBalance).to.equal(initialBalance - Number(transactionAmount));
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
          expect(newBalance).to.equal(initialBalance + Number(transactionAmount));
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
    // KNOWN APP BUG (qa-atelier#45): scoped suppression for the XState init race
    // that can leave the transaction detail view blank on Firefox; remove once
    // the app defect is fixed.
    cy.on("uncaught:exception", (err) => {
      if (err.message.includes("transactions is undefined")) {
        return false;
      }
      return true;
    });

    // Arrange
    const commentText = `TC-015 comment ${Date.now()}`;

    cy.intercept("GET", `${getApiUrl()}/transactions/public*`).as("publicFeed");
    cy.intercept("GET", `${getApiUrl()}/transactions/*`).as("transactionDetail");
    cy.intercept("POST", `${getApiUrl()}/comments/*`).as("postComment");

    // Act: open the first transaction in the public feed
    cy.visit("/");
    cy.wait("@publicFeed");

    // Ensure the feed has rendered at least one transaction before interacting
    cy.getBySel("transaction-list")
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
      // Give the XState-hydrated detail view extra time to render on Firefox.
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
    // KNOWN APP BUG (qa-atelier#45): the RWA feed can briefly render with
    // undefined transactions while XState machines initialise. The suppression
    // below is scoped to exactly that error and must be removed once #45 is
    // fixed — do not widen it.
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes("can't access property \"length\", transactions is undefined")
      ) {
        return false;
      }
      return true;
    });

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
      cy.getBySel("sidenav-user-balance")
        .invoke("text")
        .should((newBalanceText) => {
          const newBalance = parseFloat(newBalanceText.replace(/[$,]/g, ""));
          expect(newBalance).to.equal(initialBalance - Number(requestAmount));
        });
    });

    // Assert requester balance increased by the requested amount
    homePage.logout();
    loginPage.login(requesterUsername, requesterPassword);

    cy.get<number>("@requesterInitialBalance").then((initialBalance) => {
      cy.getBySel("sidenav-user-balance")
        .invoke("text")
        .should((newBalanceText) => {
          const newBalance = parseFloat(newBalanceText.replace(/[$,]/g, ""));
          expect(newBalance).to.equal(initialBalance + Number(requestAmount));
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
    // KNOWN APP BUG (qa-atelier#45): scoped suppression for the XState init race
    // on the feed; remove once the app defect is fixed.
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes('can\'t access property "length", transactions is undefined')
      ) {
        return false;
      }
      return true;
    });

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

      // Verify the backend recorded the rejection
      cy.request("GET", `${getApiUrl()}/transactions/${requestId}`).then(
        (response) => {
          expect(response.body.transaction.requestStatus).to.equal("rejected");
        }
      );
    });
  });
});
