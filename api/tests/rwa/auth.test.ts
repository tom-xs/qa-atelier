import { describe, test, expect } from 'vitest';
import { login, authHeaders } from '../helpers/apiClient';

// NOTE: use `||` not `??` for env-var fallbacks.
// In CI, a missing GitHub Secret expands to an EMPTY STRING (not undefined),
// so `process.env.RWA_USER ?? 'Heath93'` would yield '' and login would 401.
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const USER = process.env.RWA_USER || 'Heath93';
const PASS = process.env.RWA_PASS || 's3cret';

describe('RWA API — Auth', () => {
  test('POST /login returns the user and a session cookie', async () => {
    // Arrange + Act
    const session = await login(USER, PASS);

    // Assert — RWA answers with the user object and a connect.sid
    // session cookie (no JWT/bearer token; see apps/rwa/backend/auth.ts)
    expect(typeof session.user.id).toBe('string');
    expect(session.user.id.length).toBeGreaterThan(0);
    expect(session.user.username).toBe(USER);
    expect(session.cookie).toMatch(/^connect\.sid=/);
  });

  test('POST /login returns 401 for wrong password', async () => {
    // Arrange + Act
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: USER, password: 'wrongpassword' }),
    });

    // Assert
    expect(res.status).toBe(401);
  });

  test('session cookie grants access to protected endpoints', async () => {
    // Arrange
    const session = await login(USER, PASS);

    // Act
    const authed = await fetch(`${BASE_URL}/users`, {
      headers: authHeaders(session.cookie),
    });
    const anonymous = await fetch(`${BASE_URL}/users`);

    // Assert
    expect(authed.status).toBe(200);
    expect(anonymous.status).toBe(401);
  });
});
