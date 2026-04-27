import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/src/server/db";
import { hashPassword, createSession } from "@/src/server/auth";
import { getSessionCookieName } from "@/src/server/session";
import { createId } from "@/src/domain/id";
import { supabaseAdmin } from "@/src/server/supabase";

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

    const { error: remoteError } = await supabaseAdmin.from("users").insert({
      id: userId,
      nickname: nickname.trim(),
      avatar_url: avatarUrl || "",
      password_hash: passwordHash,
      home_persona_asset_id: null,
      bio: "",
      living_city: "",
      hometown: "",
      age: "",
      tags: [],
      current_trip_id: null,
      is_authorized: true,
      created_at: now,
      updated_at: now,
    });

    if (remoteError) {
      if (remoteError.code === "23505") {
        return NextResponse.json({ error: "用户已存在" }, { status: 409 });
      }
      throw remoteError;
    }

    db.prepare(
      `INSERT INTO users (id, nickname, avatar_url, password_hash, home_persona_asset_id, bio, living_city, hometown, age, tags, current_trip_id, is_authorized, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, '', '', '', '', '[]', NULL, 1, ?, ?)`
    ).run(userId, nickname.trim(), avatarUrl || "", passwordHash, now, now);

    const { sessionId } = await createSession(userId);
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
