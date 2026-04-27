import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { withSupabaseTripService } from "@/src/server/trip-service-runner";
import { BusinessError } from "@/src/domain/errors";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
  ) {
  try {
    const userId = await requireCurrentUser();
    const body = await request.json();
    await params;

    if (body.action === "toggle") {
      const result = await withSupabaseTripService(userId, (service) =>
        service.toggleFavoriteMember(body.targetUserId)
      );
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
    const favoritesData = await withSupabaseTripService(userId, (service) =>
      service.getFavoritesPageData()
    );
    return NextResponse.json(favoritesData);
  } catch (error) {
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
