import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getSupabaseAdmin } from "./supabase";

const SALT_ROUNDS = 10;
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<{ sessionId: string; expiresAt: number }> {
  const supabaseAdmin = getSupabaseAdmin();
  const sessionId = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_MS;

  const { error } = await supabaseAdmin.from("sessions").insert({
    id: sessionId,
    user_id: userId,
    expires_at: expiresAt,
    created_at: now,
  });

  if (error) {
    throw error;
  }

  return { sessionId, expiresAt };
}

export async function getSessionUserId(sessionId: string): Promise<string | null> {
  const supabaseAdmin = getSupabaseAdmin();
  const now = Date.now();
  const { data, error } = await supabaseAdmin
    .from("sessions")
    .select("user_id")
    .eq("id", sessionId)
    .gt("expires_at", now)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.user_id ?? null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("sessions").delete().eq("id", sessionId);
  if (error) {
    throw error;
  }
}

export async function cleanExpiredSessions(): Promise<void> {
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin
    .from("sessions")
    .delete()
    .lte("expires_at", Date.now());

  if (error) {
    throw error;
  }
}
