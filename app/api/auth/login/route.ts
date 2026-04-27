import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSession } from "@/src/server/auth";
import { getSessionCookieName } from "@/src/server/session";
import { supabaseAdmin } from "@/src/server/supabase";
import { getDb } from "@/src/server/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, password } = body;

    if (!nickname?.trim() || !password) {
      return NextResponse.json({ error: "请填写昵称和密码" }, { status: 400 });
    }

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, nickname, avatar_url, password_hash")
      .eq("nickname", nickname.trim())
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "密码错误" }, { status: 401 });
    }

    const { sessionId } = await createSession(user.id);
    const db = getDb();
    const localUser = db
      .prepare("SELECT id, nickname, avatar_url FROM users WHERE id = ?")
      .get(user.id) as any;
    const response = NextResponse.json({
      user: {
        id: user.id,
        nickname: localUser?.nickname ?? user.nickname,
        avatarUrl: localUser?.avatar_url ?? user.avatar_url,
      },
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
