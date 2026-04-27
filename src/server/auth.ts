import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "./db";

const SALT_ROUNDS = 10;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSession(userId: string): { sessionId: string; expiresAt: number } {
  const db = getDb();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MS;

  db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(sessionId, userId, expiresAt, now);

  return { sessionId, expiresAt };
}

export function getSessionUserId(sessionId: string): string | null {
  const db = getDb();
  const now = Date.now();
  const row = db.prepare("SELECT user_id FROM sessions WHERE id = ? AND expires_at > ?")
    .get(sessionId, now) as { user_id: string } | undefined;

  if (!row) return null;
  return row.user_id;
}

export function deleteSession(sessionId: string): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function cleanExpiredSessions(): void {
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
}
