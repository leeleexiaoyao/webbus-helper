import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { SqliteStore } from "@/src/server/repositories/sqlite-store";
import { TripService } from "@/src/domain/trip-service";
import { BusinessError } from "@/src/domain/errors";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireCurrentUser();
    const body = await request.json();
    const store = new SqliteStore(userId);
    const service = new TripService(store);

    service.ensureAuthorizedAccess();
    service.joinTripByPassword(body.password);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "加入失败" }, { status: 500 });
  }
}
