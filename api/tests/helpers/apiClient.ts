const BASE_URL = process.env.API_URL || 'http://localhost:3001';

export interface RwaUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
}

export interface Session {
  user: RwaUser;
  /** connect.sid session cookie — RWA uses cookie sessions, not bearer tokens */
  cookie: string;
}

export async function login(
  username: string,
  password: string,
): Promise<Session> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);

  const setCookie = res.headers.get('set-cookie') ?? '';
  const cookie = setCookie.split(';')[0];
  const body = (await res.json()) as { user: RwaUser };
  return { user: body.user, cookie };
}

export function authHeaders(cookie: string): Record<string, string> {
  return {
    Cookie: cookie,
    'Content-Type': 'application/json',
  };
}
