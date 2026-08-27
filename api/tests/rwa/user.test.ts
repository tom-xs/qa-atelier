import { describe, test, expect } from 'vitest';
import { login, authHeaders } from '../helpers/apiClient';

// NOTE: use `||` not `??` for env-var fallbacks (missing CI secrets expand to '').
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const USER = process.env.RWA_USER || 'Heath93';
const PASS = process.env.RWA_PASS || 's3cret';
const TARGET_USER = process.env.RWA_TARGET_USER || 'Dina20';

interface RwaUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface SearchResponse {
  results: RwaUser[];
}

async function searchUsers(session: { cookie: string }, query: string): Promise<SearchResponse> {
  const res = await fetch(`${BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
    headers: authHeaders(session.cookie),
  });
  expect(res.status).toBe(200);
  return (await res.json()) as SearchResponse;
}

async function listUsers(session: { cookie: string }): Promise<RwaUser[]> {
  const res = await fetch(`${BASE_URL}/users`, {
    headers: authHeaders(session.cookie),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { results: RwaUser[] };
  return body.results;
}

describe('RWA API — Users', () => {
  test('[TC-017] user search returns matching users', async () => {
    // Arrange
    const session = await login(USER, PASS);

    // Discover the target user's current profile data so the test stays
    // independent of seed variations (firstName/lastName differ across seeds).
    const allUsers = await listUsers(session);
    const target = allUsers.find((u) => u.username === TARGET_USER);
    expect(target).toBeDefined();

    // Act: search by username and by the target user's first name
    const byUsername = await searchUsers(session, target!.username);
    const byFirstName = await searchUsers(session, target!.firstName);

    // Assert: target user appears in results
    expect(byUsername.results.map((u) => u.username)).toContain(TARGET_USER);
    expect(byFirstName.results.map((u) => u.username)).toContain(TARGET_USER);

    // Assert: the authenticated user is never returned in search results
    expect(byUsername.results.map((u) => u.username)).not.toContain(USER);
    expect(byFirstName.results.map((u) => u.username)).not.toContain(USER);

    // Assert: an empty result set is returned when no user matches
    const empty = await searchUsers(session, 'zzzznomatch');
    expect(empty.results).toEqual([]);
  });
});
