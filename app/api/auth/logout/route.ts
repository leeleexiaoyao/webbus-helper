import { NextResponse } from "next/server";
import { logoutCurrentUser, getSessionCookieName } from "@/src/server/session";

export async function POST() {
  await logoutCurrentUser();
  const response = NextResponse.json({ success: true });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
