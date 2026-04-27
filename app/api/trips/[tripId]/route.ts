import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { getDb } from "@/src/server/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const userId = await requireCurrentUser();
    const { tripId } = await params;
    
    const db = getDb();
    const trip = db.prepare(
      `SELECT id, name, departure_time, status, seat_codes, seat_map 
       FROM trips 
       WHERE id = ?`
    ).get(tripId) as { [key: string]: any };
    
    if (!trip) {
      return NextResponse.json({ error: "车次不存在" }, { status: 404 });
    }
    
    // 解析JSON字段
    const parsedTrip = {
      ...trip,
      seat_codes: JSON.parse(trip.seat_codes as string),
      seat_map: JSON.parse(trip.seat_map as string)
    };
    
    return NextResponse.json(parsedTrip);
  } catch (error) {
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
