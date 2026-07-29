# QA Atelier

A personal practice workspace for Android, web, and API test automation.

## Frameworks
- **Playwright** (TypeScript) — web E2E
- **Cypress** — Cypress Real World App (submodule at `apps/rwa`)
- **Selenium** (Python) — cross-browser web
- **UIAutomator** (Kotlin) — Android native
- **Postman / Newman + Vitest** — REST API contract tests (`api/`)

## Setup (NixOS / Home Manager)

```bash
git clone --recurse-submodules https://github.com/tom-xs/qa-atelier.git
cd qa-atelier
nix develop        # or: direnv allow
```

Each framework folder is self-contained with its own lockfile — install
inside the folder you're working on (e.g. `cd web/playwright && npm install`).

## Running tests

```bash
make test-playwright
make test-cypress
make test-selenium
make test-android
make test-api
make test-all
```

For Cypress RWA auth specs, set `CYPRESS_RWA_USER` and `CYPRESS_RWA_PASS` in your environment (or CI secrets).
