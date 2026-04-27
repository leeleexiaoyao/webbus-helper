import { cookies } from "next/headers";
import { getSessionUserId, deleteSession } from "./auth";

const SESSION_COOKIE_NAME = "bus_buddy_session";

export function getSessionCookieName(): string {
  return SESSION_COOKIE_NAME;
}

export async function getCurrentSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUserId(): Promise<string | null> {
  const sessionId = await getCurrentSessionId();
  if (!sessionId) return null;
  return await getSessionUserId(sessionId);
}

export async function requireCurrentUser(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
}

export async function logoutCurrentUser(): Promise<void> {
  const sessionId = await getCurrentSessionId();
  if (sessionId) {
    await deleteSession(sessionId);
  }
}
