import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/src/server/db";
import { hashPassword, createSession } from "@/src/server/auth";
import { getSessionCookieName } from "@/src/server/session";
import { createId } from "@/src/domain/id";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, password, avatarUrl } = body;

    if (!nickname?.trim()) {
      return NextResponse.json({ error: "请填写昵称" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    const db = getDb();
    const userId = createId("user");
    const passwordHash = await hashPassword(password);
    const now = Date.now();

    db.prepare(
      `INSERT INTO users (id, nickname, avatar_url, password_hash, home_persona_asset_id, bio, living_city, hometown, age, tags, current_trip_id, is_authorized, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, '', '', '', '', '[]', NULL, 1, ?, ?)`
    ).run(userId, nickname.trim(), avatarUrl || "", passwordHash, now, now);

    const { sessionId } = createSession(userId);
    const response = NextResponse.json({
      user: { id: userId, nickname: nickname.trim(), avatarUrl: avatarUrl || "" },
    });

    response.cookies.set(getSessionCookieName(), sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "用户已存在" }, { status: 409 });
    }
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
