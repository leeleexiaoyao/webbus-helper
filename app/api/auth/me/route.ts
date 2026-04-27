import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/server/session";
import { getDb } from "@/src/server/db";
import { supabaseAdmin } from "@/src/server/supabase";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const db = getDb();
    const user = db
      .prepare("SELECT id, nickname, avatar_url, home_persona_asset_id, bio, living_city, hometown, age, tags, current_trip_id, is_authorized FROM users WHERE id = ?")
      .get(userId) as any;

    if (!user) {
      const { data: remoteUser, error } = await supabaseAdmin
        .from("users")
        .select("id, nickname, avatar_url, home_persona_asset_id, bio, living_city, hometown, age, tags, current_trip_id, is_authorized")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!remoteUser) {
        return NextResponse.json({ user: null });
      }

      return NextResponse.json({
        user: {
          id: remoteUser.id,
          nickname: remoteUser.nickname,
          avatarUrl: remoteUser.avatar_url,
          homePersonaAssetId: remoteUser.home_persona_asset_id,
          bio: remoteUser.bio,
          livingCity: remoteUser.living_city,
          hometown: remoteUser.hometown,
          age: remoteUser.age,
          tags: Array.isArray(remoteUser.tags) ? remoteUser.tags : [],
          currentTripId: remoteUser.current_trip_id,
          isAuthorized: Boolean(remoteUser.is_authorized),
        },
      });
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
        tags: typeof user.tags === "string" ? JSON.parse(user.tags) : user.tags,
        currentTripId: user.current_trip_id,
        isAuthorized: Boolean(user.is_authorized),
      },
    });
  } catch (error) {
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
