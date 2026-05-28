# QA Atelier — Copilot Instructions

## Project context
This is a QA automation monorepo testing Spotify, Airbnb, and the
Cypress Real World App using:
- Playwright (TypeScript) for web E2E tests
- Cypress for component and integration tests
- Selenium (Python) for cross-browser coverage
- UIAutomator (Kotlin) for Android testing

## Test conventions
- Always use Page Object Model (POM) for web frameworks
- Use Screen Object Model for Android (UIAutomator)
- Selectors use data-testid: cy.getBySel('element-id')
- Tests must be fully independent and runnable in any order
- Group related scenarios in describe/class blocks
- Test names follow: [action] [expected result]

## Waiting strategy
- Playwright: use expect(locator).toBeVisible() and waitFor()
- Cypress: use should('be.visible') and intercept/wait pairs
- Selenium: use WebDriverWait with expected_conditions
- NEVER use hardcoded waits (sleep, cy.wait(ms))

## Code style
- TypeScript strict mode enabled
- Prefer async/await over Promise chains
- Never hardcode credentials — use fixtures or environment variables
- Use faker.js for test data generation

## Apps under test
- Cypress Real World App: http://localhost:3000
- TBC
