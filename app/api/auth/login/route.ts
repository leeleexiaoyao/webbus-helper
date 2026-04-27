import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/src/server/db";
import { verifyPassword, createSession } from "@/src/server/auth";
import { getSessionCookieName } from "@/src/server/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, password } = body;

    if (!nickname?.trim() || !password) {
      return NextResponse.json({ error: "请填写昵称和密码" }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare("SELECT * FROM users WHERE nickname = ?").get(nickname.trim()) as any;

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    const { sessionId } = createSession(user.id);
    const response = NextResponse.json({
      user: { id: user.id, nickname: user.nickname, avatarUrl: user.avatar_url },
    });

    response.cookies.set(getSessionCookieName(), sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "登录失败" }, { status: 500 });
  }
}
