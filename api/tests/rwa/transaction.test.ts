import { describe, test, expect } from 'vitest';
import { login, authHeaders } from '../helpers/apiClient';

// NOTE: use `||` not `??` for env-var fallbacks (missing CI secrets expand to '').
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const USER = process.env.RWA_USER || 'Heath93';
const PASS = process.env.RWA_PASS || 's3cret';
const TARGET_USER = process.env.RWA_TARGET_USER || 'Dina20';

interface RwaUserWithBalance {
  id: string;
  username: string;
  balance: number;
}

interface TransactionResponse {
  transaction: {
    id: string;
    amount: number;
    receiverId: string;
    senderId: string;
    status: string;
    description: string;
  };
}

interface BankTransfer {
  id: string;
  userId: string;
  transactionId: string;
  amount: number;
  type: 'deposit' | 'withdrawal';
}

async function getUser(session: { cookie: string }, userId: string): Promise<RwaUserWithBalance> {
  const res = await fetch(`${BASE_URL}/users/${userId}`, {
    headers: authHeaders(session.cookie),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { user: RwaUserWithBalance };
  return body.user;
}

async function findTargetUser(session: { cookie: string }, username: string): Promise<RwaUserWithBalance> {
  const res = await fetch(`${BASE_URL}/users`, {
    headers: authHeaders(session.cookie),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { results: RwaUserWithBalance[] };
  const user = body.results.find((u) => u.username === username);
  if (!user) throw new Error(`Target user ${username} not found`);
  return user;
}

async function createPayment(
  session: { cookie: string },
  receiverId: string,
  amount: number,
  description: string,
): Promise<TransactionResponse> {
  const res = await fetch(`${BASE_URL}/transactions`, {
    method: 'POST',
    headers: authHeaders(session.cookie),
    body: JSON.stringify({
      transactionType: 'payment',
      amount,
      description,
      receiverId,
    }),
  });
  expect(res.status).toBe(200);
  return (await res.json()) as TransactionResponse;
}

async function getBankTransfers(session: { cookie: string }): Promise<BankTransfer[]> {
  const res = await fetch(`${BASE_URL}/bankTransfers`, {
    headers: authHeaders(session.cookie),
  });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { transfers: BankTransfer[] };
  return body.transfers;
}

describe('RWA API — Transactions', () => {
  test('[TC-014] payment above balance triggers bank-transfer withdrawal and completes', async () => {
    // Arrange
    const session = await login(USER, PASS);
    const sender = await getUser(session, session.user.id);
    const receiver = await findTargetUser(session, TARGET_USER);
    const receiverBefore = receiver.balance;

    // Amount is in cents on the backend; the API expects dollars.
    const overdraftAmount = Math.floor(sender.balance / 100) + 1000;
    const description = `TC-014 overdraft ${Date.now()}`;

    // Act
    const { transaction } = await createPayment(session, receiver.id, overdraftAmount, description);

    // Assert transaction completed (RWA does not reject overdraft payments)
    expect(transaction.status).toBe('complete');
    expect(transaction.senderId).toBe(sender.id);
    expect(transaction.receiverId).toBe(receiver.id);
    expect(transaction.amount).toBe(overdraftAmount * 100);

    // Assert sender PayApp balance is zeroed
    const senderAfter = await getUser(session, sender.id);
    expect(senderAfter.balance).toBe(0);

    // Assert receiver balance increased by full payment amount
    const receiverAfter = await findTargetUser(session, TARGET_USER);
    expect(receiverAfter.balance).toBe(receiverBefore + overdraftAmount * 100);

    // Assert a withdrawal bank transfer was created for the overdraft portion
    const transfers = await getBankTransfers(session);
    const withdrawal = transfers.find(
      (t) => t.transactionId === transaction.id && t.type === 'withdrawal',
    );
    expect(withdrawal).toBeDefined();
    expect(withdrawal!.amount).toBe(overdraftAmount * 100 - sender.balance);
  });
});
