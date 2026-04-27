import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { saveAvatar, getAllowedImageExt } from "@/src/server/upload";
import { getDb } from "@/src/server/db";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireCurrentUser();
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "请选择头像" }, { status: 400 });
    }

    const ext = getAllowedImageExt(file.type);
    if (!ext) {
      return NextResponse.json({ error: "不支持的图片格式" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "图片不能超过5MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const avatarUrl = saveAvatar(userId, buffer, ext);

    const db = getDb();
    const now = Date.now();
    db.prepare("UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?")
      .run(avatarUrl, now, userId);

    return NextResponse.json({ avatarUrl });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
