import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Next.js API routes 中 process.cwd() 可能指向 workspace 根目录
    // 需要确保 data 目录在网页版/ 下
    let dbDir = path.join(process.cwd(), "data");
    // 如果 data 目录不存在且上级目录有 data，使用上级
    if (!fs.existsSync(path.join(dbDir, "..", "网页版")) && process.cwd().includes("workspace")) {
      dbDir = path.join(process.cwd(), "网页版", "data");
    }
    fs.mkdirSync(dbDir, { recursive: true });
    const dbPath = path.join(dbDir, "app.sqlite");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL DEFAULT '',
      avatar_url TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL DEFAULT '',
      home_persona_asset_id TEXT,
      bio TEXT NOT NULL DEFAULT '',
      living_city TEXT NOT NULL DEFAULT '',
      hometown TEXT NOT NULL DEFAULT '',
      age TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      current_trip_id TEXT,
      is_authorized INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '未命名车次',
      departure_time TEXT NOT NULL DEFAULT '待定',
      password TEXT NOT NULL,
      template_id TEXT NOT NULL,
      seat_codes TEXT NOT NULL DEFAULT '[]',
      seat_map TEXT NOT NULL DEFAULT '{}',
      status TEXT NOT NULL DEFAULT 'active',
      created_by_user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS trip_members (
      trip_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at INTEGER NOT NULL,
      PRIMARY KEY (trip_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS trip_favorites (
      trip_id TEXT NOT NULL,
      source_user_id TEXT NOT NULL,
      target_user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (trip_id, source_user_id, target_user_id)
    );

    CREATE TABLE IF NOT EXISTS tool_states (
      trip_id TEXT NOT NULL,
      tool_type TEXT NOT NULL,
      state_json TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (trip_id, tool_type)
    );
  `);
}
