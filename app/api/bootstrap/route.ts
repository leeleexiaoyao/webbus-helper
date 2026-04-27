import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/server/session";
import { withSupabaseTripService } from "@/src/server/trip-service-runner";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ currentUser: null });
    }
    const result = await withSupabaseTripService(userId, (service) =>
      service.bootstrapApp()
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
