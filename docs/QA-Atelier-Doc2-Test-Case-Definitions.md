---
title: "Test Case Definitions"
subtitle: "Catalog, detailed definitions, and authoring conventions for RWA test cases"
docpart: "QA Atelier · Document 2 of 3"
---

# 1. Conventions

- Test cases carry sequential IDs (**TC-XXX**) and are managed as GitHub Issues from the test-case template, labeled `type: test-case` plus framework, app, and priority labels.
- Every test case states: requirement ID, priority, type, preconditions, steps, expected result, and test data.
- Automated tests follow **AAA** (Arrange–Act–Assert), Page Object Model for UI, `data-test` selectors, explicit waiting only, and full independence between tests.
- Names read as `[action] [expected result]`.

# 2. Detailed Test Cases — Existing

## 2.1 TC-002 — Create a payment transaction

| | |
|---|---|
| **Requirement** | REQ-TX-001 |
| **Priority / Type** | P1 / Functional |
| **Framework** | Cypress |
| **Issue** | qa-atelier #6 · Status: automated — success alert, feed presence, and sender/receiver balance deltas all asserted in `web/cypress/e2e/rwa/transaction.cy.ts` |

**Preconditions**

- RWA is running at http://localhost:3000
- User Heath93 exists (seeded by default)

**Steps**

1. Log in and navigate to the dashboard
2. Click "New Transaction"
3. Search for another user
4. Select the first result
5. Enter an amount and description
6. Click "Pay"

**Expected result**

- A success alert is shown
- The transaction appears in the feed
- Sender balance decreases, receiver balance increases by the amount

## 2.2 TC-003 — Request money from another user

| | |
|---|---|
| **Requirement** | REQ-TX-002 |
| **Priority / Type** | P1 / Functional |
| **Framework** | Cypress |
| **Issue** | qa-atelier #7 · Status: automated in `web/cypress/e2e/rwa/transaction.cy.ts` — success alert, feed presence, and recipient notification asserted |

**Preconditions**

- RWA is running at http://localhost:3000
- Logged in as Heath93

**Steps**

1. Log in and navigate to the dashboard
2. Click "New Transaction"
3. Search for another user and select them
4. Enter an amount and description
5. Click "Request" instead of "Pay"

**Expected result**

- A success alert is shown
- The transaction appears in the feed with "requested" status
- The recipient sees a pending request in their notifications

## 2.2a TC-012 — Recipient accepts a money request

| | |
|---|---|
| **Requirement** | REQ-TX-004 |
| **Priority / Type** | P1 / Functional |
| **Framework** | Cypress |
| **Issue** | qa-atelier #24 · Status: automated |

**Preconditions**

- RWA is running at http://localhost:3000
- Seeded users Heath93 (requester) and Dina20 (recipient) exist

**Steps**

1. Log in as Heath93 and request $100 from Dina20
2. Log out and log in as Dina20
3. Open the request transaction detail
4. Click **Accept Request**

**Expected result**

- The request is accepted and its status changes to a completed payment
- The request detail no longer shows the **Accept** / **Reject** buttons
- Dina20's balance decreases by the requested amount
- Heath93's balance increases by the requested amount
- The completed payment appears in the transaction feed

**Automation:** covered by `[TC-012] Recipient accepts a money request` in `web/cypress/e2e/rwa/transaction.cy.ts`. The test reuses the request-creation flow from TC-003, captures the transaction id from the feed, opens the detail view as the recipient, clicks `transaction-accept-request-<id>`, asserts the status changed to "charged", and verifies both users' balance deltas after re-logging in. The narrowly-scoped `uncaught:exception` suppression for the feed's XState init race masks a real app defect — tracked as qa-atelier #45, to be removed once fixed.

## 2.3 TC-004 — User cannot log in with invalid credentials

| | |
|---|---|
| **Requirement** | REQ-AUTH-002 |
| **Priority / Type** | P0 / Smoke, Negative |
| **Framework** | Cypress |
| **Issue** | qa-atelier #8 · Status: automated — all three expected results asserted in `web/cypress/e2e/rwa/auth.cy.ts` (stays on `/signin`, error message visible, no `connect.sid` cookie) |

**Preconditions**

- RWA is running at http://localhost:3000

**Steps**

1. Navigate to http://localhost:3000
2. Enter username: Heath93
3. Enter an incorrect password: wrongpassword123
4. Click the sign in button

**Expected result**

- User remains on the login page
- An error message is displayed indicating invalid credentials
- No authentication token (session cookie) is stored

**Test data:** username `Heath93`, password `wrongpassword123`

## 2.4 TC-005 — RWA API auth collection + CI environment

| | |
|---|---|
| **Requirements** | REQ-AUTH-001, REQ-AUTH-002 |
| **Priority / Type** | P1 / API Contract |
| **Framework** | Postman / Newman |
| **Issue** | qa-atelier #12 · Status: automated |

**Collection** `rwa-auth.postman_collection.json`:

| Request | Assertions |
|---|---|
| POST /login (valid) | 200; `user.id` non-empty string; `user.username` matches; `connect.sid` cookie present (`pm.cookies.has`); chain `userId` into environment |
| POST /login (bad password) | 401; error message in body |
| GET /users | 200 with session cookie (jar handles it); `results` is an array |
| GET /users/{{userId}} | 200; profile matches logged-in user |

**Environment** `ci.postman_environment.json`: `baseUrl=http://localhost:3001`, `username=Heath93`, `password` initial value `{{RWA_PASS}}` (real value only in current value / CI secret), empty `userId`.

**Done when:** collection and environment exported to `api/`; `bash api/newman/run-all.sh` green locally and in CI.

**Scope note:** the login response-time budget (< 500 ms) is intentionally **not** asserted here — it is owned by TC-020, so the budget check lives in exactly one case.

## 2.7 TC-021 — Client-side login validation blocks empty submission

| | |
|---|---|
| **Requirements** | REQ-AUTH-001, REQ-AUTH-002 |
| **Priority / Type** | P2 / Functional — client-side validation |
| **Framework** | Cypress |
| **Issue** | qa-atelier #31 · Status: automated |

**Preconditions:** RWA at http://localhost:3000; no input entered yet.

**Steps:** open the sign-in page; verify no error/helper text before interaction; click **Sign In** with both fields empty.

**Expected result:** no error shown by default; submission blocked (no request reaches `POST /login`); helper text appears under the empty required fields.

**Automation:** covered by `blocks login with empty fields` and `doesn't display error message by default` in `web/cypress/e2e/rwa/auth.cy.ts` (selector fixed to `#username-helper-text` during the TC-tagging refactor).

## 2.8 TC-022 — Log in with valid credentials via the UI

| | |
|---|---|
| **Requirement** | REQ-AUTH-001 |
| **Priority / Type** | P1 / Functional — Smoke, positive path |
| **Framework** | Cypress |
| **Issue** | qa-atelier #30 · Status: automated |

**Preconditions:** RWA at http://localhost:3000; seeded user `Heath93` / `s3cret`; credentials via `CYPRESS_RWA_USER` / `CYPRESS_RWA_PASS`.

**Steps:** open the sign-in page; enter valid credentials; click **Sign In**.

**Expected result:** redirect to `/`; authenticated UI renders (notifications indicator in the top nav); `connect.sid` cookie set.

**Automation:** covered by `logs in successfully with valid credentials` in `web/cypress/e2e/rwa/auth.cy.ts`. Complements the ID-less Vitest auth suite (§2.9), which covers REQ-AUTH-001 at the API layer.

## 2.5 TC-006 — Log out invalidates the session

| | |
|---|---|
| **Requirement** | REQ-AUTH-003 |
| **Priority / Type** | P1 / Functional |
| **Framework** | Cypress |
| **Issue** | qa-atelier #18 · Status: automated |

**Preconditions**

- RWA is running at http://localhost:3000
- Seeded user Heath93 exists

**Steps**

1. Log in as Heath93
2. Click the sign-out button in the side nav
3. Try to visit the dashboard (`/`) or another authenticated route

**Expected result**

- User is redirected to `/signin`
- `connect.sid` cookie no longer exists
- A protected page cannot be accessed without re-logging in

**Automation:** covered by `log out invalidates the session` in `web/cypress/e2e/rwa/auth.cy.ts`.

## 2.6 TC-007 — Sign up creates a new account

| | |
|---|---|
| **Requirement** | REQ-AUTH-004 |
| **Priority / Type** | P1 / Functional |
| **Framework** | Cypress |
| **Issue** | qa-atelier #15 · Status: automated |

**Preconditions**

- RWA is running at http://localhost:3000

**Steps**

1. Navigate to `/signup`
2. Fill first name, last name, username, password, confirm password
3. Click **Sign Up**

**Expected result**

- After clicking **Sign Up**, the user is redirected to `/signin` (verified behavior of the current RWA build — there is no auto-login after signup)
- Signing in with the newly created credentials succeeds: redirect to `/`, `connect.sid` cookie set, authenticated UI renders (e.g., notifications indicator in top nav)

**Automation:** covered by `[TC-007] Sign up creates a new account` in `web/cypress/e2e/rwa/signup.cy.ts`. The spec signs in with the newly created account to prove the account exists and reaches the authenticated dashboard. Username and password are generated uniquely per run (`Date.now()`), which avoids collisions across runs and keeps a hardcoded password out of the repo (flagged by GitGuardian on PR #41).

## 2.9 Vitest auth suite — automated

| | |
|---|---|
| **Requirements** | REQ-AUTH-001, REQ-AUTH-002, REQ-AUTH-005 |
| **Priority / Type** | P0 / API Contract |
| **Framework** | Vitest (`api/tests/rwa/auth.test.ts`) |
| **Status** | Automated, green in CI |

| Test | Assertions |
|---|---|
| POST /login returns the user and a session cookie | `user.id` non-empty string; `user.username` equals the login user; cookie matches `connect.sid=` |
| POST /login returns 401 for wrong password | status 401 |
| Session cookie grants access to protected endpoints | `GET /users` → 200 with cookie, 401 without |

Credentials from `RWA_USER` / `RWA_PASS` env vars with `||` fallback to public seed credentials (missing CI secrets expand to empty strings, which `??` would not catch).

## 2.10 TC-009 — Link a new bank account

| | |
|---|---|
| **Requirement** | REQ-BANK-001 |
| **Priority / Type** | P1 / Functional |
| **Framework** | Cypress |
| **Issue** | qa-atelier #16 · Status: automated |

**Preconditions**

- RWA is running at http://localhost:3000
- Logged in as a seeded user (e.g., Heath93)

**Steps**

1. Log in and navigate to `/bankaccounts` (via side nav `sidenav-bankaccounts`)
2. Click **Create** (`bankaccount-new`)
3. Fill bank name, routing number (9 digits), account number (9–12 digits)
4. Click **Save** (`bankaccount-submit`)

**Expected result**

- User remains on `/bankaccounts`
- The new bank account appears in the bank account list (`bankaccount-list`)

**Automation:** covered by `[TC-009] Link a new bank account` in `web/cypress/e2e/rwa/bank.cy.ts`. Implementation helpers live in `RwaBankAccountPage` and `RWAHomePage#openBankAccounts` (`web/cypress/pages/rwa/`). The bank name is generated uniquely with `Test Bank ${Date.now()}` to avoid collisions across test runs.

## 2.11 TC-011 — Feeds filter Mine / Friends / Public correctly

| | |
|---|---|
| **Requirement** | REQ-TX-003 |
| **Priority / Type** | P1 / Functional |
| **Framework** | Cypress |
| **Issue** | qa-atelier #20 · Status: automated |

**Preconditions**

- RWA is running at http://localhost:3000
- Logged in as a seeded user (e.g., Heath93)

**Steps**

1. Log in and navigate to the dashboard
2. Click each feed tab: Everyone (Public), Friends (Contacts), Mine (Personal)

**Expected result**

- Each tab loads the correct filtered list of transactions:
  - **Everyone/Public** (`/`): calls `GET /transactions/public` and renders public transactions
  - **Friends/Contacts** (`/contacts`): calls `GET /transactions/contacts` and renders contact transactions
  - **Mine/Personal** (`/personal`): calls `GET /transactions` and renders the user's own transactions

**Automation:** covered by `[TC-011] Feeds filter Mine / Friends / Public correctly` in `web/cypress/e2e/rwa/feed.cy.ts`. Helpers live in `RwaTransactionPage`; the spec intercepts each feed endpoint, verifies the route and a non-empty response, and asserts that every returned transaction ID is rendered.

## 2.12 TC-014 — Payment above balance triggers bank-transfer withdrawal

| | |
|---|---|
| **Requirement** | REQ-TX-006 |
| **Priority / Type** | P1 / Negative |
| **Framework** | Vitest (`api/tests/rwa/transaction.test.ts`) |
| **Issue** | qa-atelier #20 · Status: automated |

**Preconditions**

- RWA API is running at http://localhost:3001
- Seeded users Heath93 and Dina20 exist

**Steps**

1. Log in as Heath93 and read the current PayApp balance
2. `POST /transactions` with `transactionType: payment`, amount greater than the balance, and receiver Dina20

**Expected result**

- The API returns 200 and the transaction status is `complete` (RWA does **not** reject the payment)
- Heath93's PayApp balance is reset to `0`
- A `withdrawal` bank transfer is created for the overdraft amount
- Dina20's balance increases by the full payment amount

**Automation:** covered by `[TC-014] payment above balance triggers bank-transfer withdrawal and completes` in `api/tests/rwa/transaction.test.ts`.

## 2.13 TC-016 — Notification appears for received request

| | |
|---|---|
| **Requirement** | REQ-NOTIF-001 |
| **Priority / Type** | P1 / Functional |
| **Framework** | Cypress |
| **Issue** | qa-atelier #16 · Status: automated |

**Preconditions**

- RWA is running at http://localhost:3000
- Seeded users Heath93 and Dina20 exist

**Steps**

1. Log in as Heath93 and request money from Dina20
2. Log out and log in as Dina20
3. Open the notifications panel

**Expected result**

- A notification is visible indicating that Heath93 requested a payment

**Automation:** covered by `[TC-016] Notification appears for received request` in `web/cypress/e2e/rwa/notification.cy.ts`.

## 2.14 TC-019 — API schema contract: `/transactions` response shape

| | |
|---|---|
| **Requirement** | REQ-TX-001 |
| **Priority / Type** | P1 / API Contract |
| **Framework** | Postman / Newman |
| **Issue** | qa-atelier #29 · Status: automated |

**Preconditions**

- RWA API is running at http://localhost:3001
- Seeded user Heath93 exists

**Steps**

1. `POST /login` as Heath93
2. `GET /transactions`
3. `GET /transactions/:id` using the first transaction id from the list

**Expected result**

- `GET /transactions` returns 200 with `pageData` (page, limit, hasNextPages, totalPages) and a `results` array
- Every transaction in `results` has the required fields: `id`, `uuid`, `amount`, `description`, `receiverId`, `senderId`, `privacyLevel`, `status`, `createdAt`, `modifiedAt`
- `GET /transactions/:id` returns 200 with a `transaction` object containing the same required fields

**Automation:** covered by collection `api/collections/rwa-transactions.postman_collection.json`, run by `bash api/newman/run-all.sh`. The collection logs in, asserts the list schema, then asserts the detail schema for the first returned transaction.

## 2.15 TC-010 — Bank accounts list shows linked accounts

| | |
|---|---|
| **Requirement** | REQ-BANK-002 |
| **Priority / Type** | P1 / Functional |
| **Framework** | Postman / Newman |
| **Issue** | qa-atelier #17 · Status: automated |

**Preconditions**

- RWA API is running at http://localhost:3001
- Seeded user Heath93 exists with at least one linked bank account

**Steps**

1. `POST /login` as Heath93
2. `GET /bankaccounts`

**Expected result**

- `GET /bankaccounts` returns 200 with a `results` array
- Every account has the required fields: `id`, `uuid`, `userId`, `bankName`, `accountNumber`, `routingNumber`, `isDeleted`, `createdAt`, `modifiedAt`
- Every returned account belongs to the logged-in user (`userId` matches)
- No returned account is marked as deleted (`isDeleted` is `false`)

**Automation:** covered by collection `api/collections/rwa-bank-accounts.postman_collection.json`, run by `bash api/newman/run-all.sh`.

## 2.16 TC-008 — Session persists across reload

| | |
|---|---|
| **Requirement** | REQ-AUTH-005 |
| **Priority / Type** | P1 / Functional |
| **Framework** | Playwright |
| **Issue** | qa-atelier #13 · Status: automated |

**Preconditions**

- RWA is running at http://localhost:3000
- Seeded user Heath93 exists

**Steps**

1. Open `/signin`
2. Enter valid credentials and submit
3. Wait for the dashboard to load
4. Reload the page

**Expected result**

- After login, the user is redirected to `/` and the authenticated UI is visible (notifications indicator)
- After reload, the user remains on `/` and the authenticated UI is still visible without re-entering credentials

**Automation:** covered by `[TC-008] session persists across reload` in `web/playwright/tests/rwa/auth.spec.ts`. Playwright's `webServer` config starts RWA automatically when running locally; in CI the same config reuses the started server.

## 2.17 TC-013 — Recipient rejects a money request

| | |
|---|---|
| **Requirement** | REQ-TX-004 |
| **Priority / Type** | P2 / Negative |
| **Framework** | Cypress |
| **Issue** | qa-atelier #19 · Status: automated |

**Preconditions**

- RWA is running at http://localhost:3000
- Seeded users Heath93 (requester) and Dina20 (recipient) exist

**Steps**

1. Log in as Heath93 and request $100 from Dina20
2. Log out and log in as Dina20
3. Open the request transaction detail
4. Click **Reject Request**

**Expected result**

- The request detail no longer shows the **Accept** / **Reject** buttons
- The backend records `requestStatus: rejected` for the transaction

**Automation:** covered by `[TC-013] Recipient rejects a money request` in `web/cypress/e2e/rwa/transaction.cy.ts`. The test reuses the request-creation flow from TC-003, captures the transaction id from the feed, opens the detail view as the recipient, clicks `transaction-reject-request-<id>`, asserts the action buttons disappear, and verifies the backend `requestStatus` via `GET /transactions/:id`.

**Known defect:** the current RWA backend (`updateTransactionById` in `apps/rwa/backend/database.ts`) does not distinguish `accepted` from `rejected` — it completes the payment in both cases. The test therefore validates the UI path and the persisted `requestStatus` rather than balance invariants.

## 2.18 TC-015 — Like and comment on a transaction

| | |
|---|---|
| **Requirement** | REQ-TX-005 |
| **Priority / Type** | P2 / Functional |
| **Framework** | Cypress |
| **Issue** | qa-atelier #21 · Status: automated |

**Preconditions**

- RWA is running at http://localhost:3000
- Seeded user Heath93 exists and the public feed contains at least one transaction

**Steps**

1. Log in as Heath93 and open the dashboard
2. Click the first transaction in the public feed
3. Click the like button
4. Type a comment and press Enter

**Expected result**

- The like count increases by one and the like button becomes disabled
- The comment appears in the comments list below the transaction

**Automation:** covered by `[TC-015] Like and comment on a transaction` in `web/cypress/e2e/rwa/transaction.cy.ts`.

# 3. Planned Test Cases

| ID | Title | Requirement | Type | Priority | Target framework |
|---|---|---|---|---|---|
| TC-017 | User search returns matching users | REQ-USER-001 | Functional | P2 | Vitest (API) |
| TC-018 | Update account settings persists | REQ-USER-003 | Functional | P2 | Playwright |
| TC-020 | Response-time budget: login under 500 ms | REQ-AUTH-001 | Non-functional | P2 | Postman / Newman |

**Coverage gaps (no test case yet, all P2):** REQ-USER-002 (view public profile), REQ-BANK-003 (delete bank account), REQ-NOTIF-002 (dismiss notifications).

# 4. Authoring Workflow for New Test Cases

1. Open an issue from the **Test case** template; it auto-labels `type: test-case`.
2. Fill requirement ID, priority, type, preconditions, numbered steps, exact expected result, test data table.
3. Add framework, app, and priority labels; place it on the board in **Backlog**.
4. Move through Exploration → In Scripting → In Review (PR open) → Done (merged, `status: automated`).
5. Update the RTM (Document 1) in the same PR that merges the automation.
