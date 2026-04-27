import Database from "better-sqlite3";
import path from "path";
import process from "process";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
}

const dbPath = path.join(process.cwd(), "data", "app.sqlite");
const sqlite = new Database(dbPath, { readonly: true });
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

function parseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function syncTable(tableName, rows) {
  if (!rows.length) {
    console.log(`${tableName}: no rows to migrate`);
    return;
  }

  const { error } = await supabase.from(tableName).upsert(rows);
  if (error) {
    throw error;
  }

  console.log(`${tableName}: migrated ${rows.length} rows`);
}

async function main() {
  const users = sqlite.prepare("SELECT * FROM users").all().map((row) => ({
    id: row.id,
    nickname: row.nickname,
    avatar_url: row.avatar_url,
    password_hash: row.password_hash,
    home_persona_asset_id: row.home_persona_asset_id,
    bio: row.bio,
    living_city: row.living_city,
    hometown: row.hometown,
    age: row.age,
    tags: parseJson(row.tags, []),
    current_trip_id: row.current_trip_id,
    is_authorized: Boolean(row.is_authorized),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  const sessions = sqlite.prepare("SELECT * FROM sessions").all().map((row) => ({
    id: row.id,
    user_id: row.user_id,
    expires_at: row.expires_at,
    created_at: row.created_at,
  }));

  const trips = sqlite.prepare("SELECT * FROM trips").all().map((row) => ({
    id: row.id,
    name: row.name,
    departure_time: row.departure_time,
    password: row.password,
    template_id: row.template_id,
    seat_codes: parseJson(row.seat_codes, []),
    seat_map: parseJson(row.seat_map, {}),
    status: row.status,
    created_by_user_id: row.created_by_user_id,
    created_at: row.created_at,
  }));

  const tripMembers = sqlite.prepare("SELECT * FROM trip_members").all().map((row) => ({
    trip_id: row.trip_id,
    user_id: row.user_id,
    role: row.role,
    joined_at: row.joined_at,
  }));

  const tripFavorites = sqlite.prepare("SELECT * FROM trip_favorites").all().map((row) => ({
    trip_id: row.trip_id,
    source_user_id: row.source_user_id,
    target_user_id: row.target_user_id,
    created_at: row.created_at,
  }));

  const toolStates = sqlite.prepare("SELECT * FROM tool_states").all().map((row) => ({
    trip_id: row.trip_id,
    tool_type: row.tool_type,
    state_json: parseJson(row.state_json, {}),
    updated_at: row.updated_at,
  }));

  await syncTable("users", users);
  await syncTable("sessions", sessions);
  await syncTable("trips", trips);
  await syncTable("trip_members", tripMembers);
  await syncTable("trip_favorites", tripFavorites);
  await syncTable("tool_states", toolStates);

  console.log("SQLite data has been copied to Supabase.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    sqlite.close();
  });
