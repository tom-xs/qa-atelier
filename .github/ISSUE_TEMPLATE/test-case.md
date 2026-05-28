---
name: Test case
about: Document a new test case for automation
labels: 'type: test-case'
---

## [TC-XXX] Brief description of what is being tested

**App:**        <!-- Spotify / Airbnb / RWA -->
**Framework:**  <!-- Playwright / Cypress / UIAutomator / Selenium -->
**Priority:**   <!-- P0 / P1 / P2 -->
**Type:**       <!-- Smoke / Functional / Regression / Exploratory -->

---

### Preconditions
- [ ] User is logged in
- [ ] App is at the starting screen

### Steps
1. Navigate to...
2. Enter... into the... field
3. Click the... button

### Expected result
<!-- Describe exactly what should happen -->

### Test data
| Field    | Value  |
|----------|--------|
| username |        |

### Automation status
- [ ] Automated
- Spec file: `web/playwright/tests/...`
- PR: #
