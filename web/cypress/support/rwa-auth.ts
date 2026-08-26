// Shared RWA credential/config helpers for Cypress specs.
//
// Single source of truth — previously each spec declared its own
// getCredentials() copy and the copies diverged: bank.cy.ts silently fell
// back to the public seed credentials while auth/feed/transaction failed
// fast. Fail-fast wins: a missing CI secret expands to "" and must fail
// loudly, never pass silently against defaults.

export interface RwaCredentials {
  username: string;
  password: string;
}

function requireEnv(key: string): string {
  const value = Cypress.env(key);
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(
      `${key} is required to run RWA tests. Set it in cypress.env.json, via the CYPRESS_${key} shell variable, or as a GitHub Actions secret.`
    );
  }
  return value;
}

/** Primary test user (seeded: Heath93). */
export function getUserCredentials(): RwaCredentials {
  return { username: requireEnv("RWA_USER"), password: requireEnv("RWA_PASS") };
}

/** Second user for payment/request flows (seeded: Dina20). */
export function getTargetUserCredentials(): RwaCredentials {
  return {
    username: requireEnv("RWA_TARGET_USER"),
    password: requireEnv("RWA_TARGET_PASS"),
  };
}

/** API base URL. The non-secret default lives in cypress.config.ts (env.API_URL) — no fallback duplicated here. */
export function getApiUrl(): string {
  return requireEnv("API_URL");
}
