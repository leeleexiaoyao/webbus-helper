import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/src/server/session";
import { getSupabaseAdmin } from "@/src/server/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    await requireCurrentUser();
    const { tripId } = await params;
    const supabaseAdmin = getSupabaseAdmin();
    const { data: trip, error } = await supabaseAdmin
      .from("trips")
      .select("id, name, departure_time, status, seat_codes, seat_map")
      .eq("id", tripId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!trip) {
      return NextResponse.json({ error: "车次不存在" }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    if ((error as any).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}
