import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { SqliteStore } from "@/src/server/repositories/sqlite-store";
import { TripService } from "@/src/domain/trip-service";
import { BusinessError } from "@/src/domain/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await requireCurrentUser();
    const { tripId } = await params;
    const body = await request.json();
    const store = new SqliteStore(userId);
    const service = new TripService(store);

    if (body.action === "toggle") {
      const result = service.toggleFavoriteMember(body.targetUserId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await requireCurrentUser();
    const store = new SqliteStore(userId);
    const service = new TripService(store);

    const favoritesData = service.getFavoritesPageData();
    return NextResponse.json(favoritesData);
  } catch (error) {
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
