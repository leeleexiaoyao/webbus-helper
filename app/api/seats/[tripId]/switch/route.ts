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

    const result = await withSupabaseTripService(userId, (service) =>
      service.switchSeat(body.targetSeatCode)
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "换座失败" }, { status: 500 });
  }
}
