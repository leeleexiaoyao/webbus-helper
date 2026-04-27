import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/server/session";
import { SqliteStore } from "@/src/server/repositories/sqlite-store";
import { TripService } from "@/src/domain/trip-service";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ currentUser: null });
    }
    const store = new SqliteStore(userId);
    const service = new TripService(store);
    const result = service.bootstrapApp();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
