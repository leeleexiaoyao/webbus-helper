import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { SqliteStore } from "@/src/server/repositories/sqlite-store";
import { TripService } from "@/src/domain/trip-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await requireCurrentUser();
    const { tripId } = await params;
    const store = new SqliteStore(userId);
    const service = new TripService(store);

    const settings = service.getTripSettings();
    return NextResponse.json(settings);
  } catch (error) {
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
