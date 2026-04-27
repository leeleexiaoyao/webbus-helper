import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { getStore } from "@/src/server/repositories/sqlite-store";
import { TripService } from "@/src/domain/trip-service";
import { BusinessError } from "@/src/domain/errors";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireCurrentUser();
    const store = getStore(userId);
    const service = new TripService(store);
    
    const body = await request.json();
    const { homePersonaAssetId } = body;
    
    const result = service.updateHomePersona(homePersonaAssetId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BusinessError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
