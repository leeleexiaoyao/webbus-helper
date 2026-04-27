import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/server/session";
import { getSupabaseAdmin } from "@/src/server/supabase";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select(
        "id, nickname, avatar_url, home_persona_asset_id, bio, living_city, hometown, age, tags, current_trip_id, is_authorized"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        avatarUrl: user.avatar_url,
        homePersonaAssetId: user.home_persona_asset_id,
        bio: user.bio,
        livingCity: user.living_city,
        hometown: user.hometown,
        age: user.age,
        tags: Array.isArray(user.tags) ? user.tags : [],
        currentTripId: user.current_trip_id,
        isAuthorized: Boolean(user.is_authorized),
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
