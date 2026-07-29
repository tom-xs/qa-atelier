import { describe, test, expect } from 'vitest';
import { login } from '../helpers/apiClient';

// NOTE: use `||` not `??` for env-var fallbacks.
// In CI, a missing GitHub Secret expands to an EMPTY STRING (not undefined),
// so `process.env.RWA_USER ?? 'Heath93'` would yield '' and login would 401.
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const USER = process.env.RWA_USER || 'Heath93';
const PASS = process.env.RWA_PASS || 's3cret';

describe('RWA API — Auth', () => {
  test('POST /login returns token for valid credentials', async () => {
    // Arrange + Act
    const body = await login(USER, PASS);

    // Assert
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
    expect(typeof body.user.id).toBe('string');
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
});
