import { BusinessError } from "../../domain/errors";
import type {
  AppState,
  MemberRole,
  Trip,
  TripFavoriteRelation,
  TripMember,
  User,
  ToolType,
} from "../../domain/types";
import { APP_STATE_VERSION, createEmptyTripTools } from "../../domain/constants";
import type { DataStore } from "../../domain/repository";
import { getDb } from "../db";

export class SqliteStore implements DataStore {
  private currentUserId: string;

  constructor(currentUserId: string) {
    this.currentUserId = currentUserId;
  }

  // ---- State operations ----

  readState(): AppState {
    const db = getDb();

    // 读取所有 users
    const userRows = db.prepare("SELECT * FROM users").all() as any[];
    const users: Record<string, User> = {};
    for (const row of userRows) {
      users[row.id] = {
        id: row.id,
        nickname: row.nickname,
        avatarUrl: row.avatar_url,
        homePersonaAssetId: row.home_persona_asset_id,
        bio: row.bio,
        livingCity: row.living_city,
        hometown: row.hometown,
        age: row.age,
        tags: JSON.parse(row.tags),
        currentTripId: row.current_trip_id,
        isAuthorized: Boolean(row.is_authorized),
      };
    }

    // 读取所有 trips
    const tripRows = db.prepare("SELECT * FROM trips").all() as any[];
    const trips: Record<string, Trip> = {};
    for (const row of tripRows) {
      // 读取该 trip 的 tool_states
      const toolStateRows = db
        .prepare("SELECT * FROM tool_states WHERE trip_id = ?")
        .all(row.id) as any[];
      const tools = createEmptyTripTools();
      for (const ts of toolStateRows) {
        tools[ts.tool_type as ToolType] = JSON.parse(ts.state_json);
      }

      trips[row.id] = {
        id: row.id,
        tripName: row.name,
        departureTime: row.departure_time,
        password: row.password,
        templateId: row.template_id,
        creatorUserId: row.created_by_user_id,
        status: row.status,
        seatCodes: JSON.parse(row.seat_codes),
        seatMap: JSON.parse(row.seat_map),
        tools,
        createdAt: row.created_at,
      };
    }

    // 读取 trip_members
    const memberRows = db.prepare("SELECT * FROM trip_members").all() as any[];
    const tripMembers: TripMember[] = memberRows.map((row) => ({
      tripId: row.trip_id,
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
    }));

    // 读取 trip_favorites
    const favoriteRows = db.prepare("SELECT * FROM trip_favorites").all() as any[];
    const tripFavorites: TripFavoriteRelation[] = favoriteRows.map((row) => ({
      tripId: row.trip_id,
      sourceUserId: row.source_user_id,
      targetUserId: row.target_user_id,
      createdAt: row.created_at,
    }));

    return {
      version: APP_STATE_VERSION,
      users,
      trips,
      tripMembers,
      tripFavorites,
      activeUserId: this.currentUserId,
    };
  }

  writeState(state: AppState): void {
    const db = getDb();
    const transaction = db.transaction(() => {
      // 同步 users
      const existingUserIds = new Set(
        (db.prepare("SELECT id FROM users").all() as any[]).map((r) => r.id)
      );

      for (const [userId, user] of Object.entries(state.users)) {
        const now = Date.now();
        if (existingUserIds.has(userId)) {
          db.prepare(
            `UPDATE users SET nickname=?, avatar_url=?, home_persona_asset_id=?, bio=?, living_city=?, hometown=?, age=?, tags=?, current_trip_id=?, is_authorized=?, updated_at=? WHERE id=?`
          ).run(
            user.nickname,
            user.avatarUrl,
            user.homePersonaAssetId,
            user.bio,
            user.livingCity,
            user.hometown,
            user.age,
            JSON.stringify(user.tags),
            user.currentTripId,
            user.isAuthorized ? 1 : 0,
            now,
            userId
          );
        } else {
          db.prepare(
            `INSERT INTO users (id, nickname, avatar_url, password_hash, home_persona_asset_id, bio, living_city, hometown, age, tags, current_trip_id, is_authorized, created_at, updated_at) VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            userId,
            user.nickname,
            user.avatarUrl,
            user.homePersonaAssetId,
            user.bio,
            user.livingCity,
            user.hometown,
            user.age,
            JSON.stringify(user.tags),
            user.currentTripId,
            user.isAuthorized ? 1 : 0,
            now,
            now
          );
        }
      }

      // 同步 trips
      const existingTripIds = new Set(
        (db.prepare("SELECT id FROM trips").all() as any[]).map((r) => r.id)
      );

      for (const [tripId, trip] of Object.entries(state.trips)) {
        if (existingTripIds.has(tripId)) {
          db.prepare(
            `UPDATE trips SET name=?, departure_time=?, password=?, template_id=?, seat_codes=?, seat_map=?, status=?, created_at=? WHERE id=?`
          ).run(
            trip.tripName,
            trip.departureTime,
            trip.password,
            trip.templateId,
            JSON.stringify(trip.seatCodes),
            JSON.stringify(trip.seatMap),
            trip.status,
            trip.createdAt,
            tripId
          );
        } else {
          db.prepare(
            `INSERT INTO trips (id, name, departure_time, password, template_id, seat_codes, seat_map, status, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            tripId,
            trip.tripName,
            trip.departureTime,
            trip.password,
            trip.templateId,
            JSON.stringify(trip.seatCodes),
            JSON.stringify(trip.seatMap),
            trip.status,
            trip.creatorUserId,
            trip.createdAt
          );
        }

        // 同步 tool_states
        for (const [toolType, toolState] of Object.entries(trip.tools)) {
          const now = Date.now();
          if (toolState) {
            db.prepare(
              `INSERT OR REPLACE INTO tool_states (trip_id, tool_type, state_json, updated_at) VALUES (?, ?, ?, ?)`
            ).run(tripId, toolType, JSON.stringify(toolState), now);
          } else {
            db.prepare(
              `DELETE FROM tool_states WHERE trip_id = ? AND tool_type = ?`
            ).run(tripId, toolType);
          }
        }
      }

      // 同步 trip_members (先清空再重建)
      db.prepare("DELETE FROM trip_members").run();
      const insertMember = db.prepare(
        "INSERT INTO trip_members (trip_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)"
      );
      for (const member of state.tripMembers) {
        insertMember.run(
          member.tripId,
          member.userId,
          member.role,
          member.joinedAt
        );
      }

      // 同步 trip_favorites (先清空再重建)
      db.prepare("DELETE FROM trip_favorites").run();
      const insertFavorite = db.prepare(
        "INSERT INTO trip_favorites (trip_id, source_user_id, target_user_id, created_at) VALUES (?, ?, ?, ?)"
      );
      for (const favorite of state.tripFavorites) {
        insertFavorite.run(
          favorite.tripId,
          favorite.sourceUserId,
          favorite.targetUserId,
          favorite.createdAt
        );
      }
    });

    transaction();
  }

  updateState<T>(updater: (state: AppState) => T): T {
    const state = this.readState();
    const result = updater(state);
    this.writeState(state);
    return result;
  }

  // ---- User operations ----

  listUsers(): User[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM users").all() as any[];
    return rows.map((row) => this.rowToUser(row));
  }

  getUser(userId: string): User {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM users WHERE id = ?")
      .get(userId) as any;
    if (!row) {
      throw new BusinessError("USER_NOT_FOUND", "未找到当前用户。");
    }
    return this.rowToUser(row);
  }

  updateUser(userId: string, updater: (user: User) => void): User {
    const user = this.getUser(userId);
    updater(user);
    this.syncUserToDb(user);
    return user;
  }

  setCurrentTripId(userId: string, tripId: string | null): User {
    return this.updateUser(userId, (user) => {
      user.currentTripId = tripId;
    });
  }

  // ---- Trip operations ----

  listTrips(): Trip[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM trips").all() as any[];
    return rows.map((row) => this.rowToTrip(row));
  }

  getTrip(tripId: string): Trip {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM trips WHERE id = ?")
      .get(tripId) as any;
    if (!row) {
      throw new BusinessError("TRIP_NOT_FOUND", "未找到对应车次。");
    }
    return this.rowToTrip(row);
  }

  updateTrip(tripId: string, updater: (trip: Trip) => void): Trip {
    const trip = this.getTrip(tripId);
    updater(trip);
    this.syncTripToDb(trip);
    return trip;
  }

  saveTrip(trip: Trip): Trip {
    const db = getDb();
    const existing = db
      .prepare("SELECT id FROM trips WHERE id = ?")
      .get(trip.id) as any;

    if (existing) {
      this.syncTripToDb(trip);
    } else {
      db.prepare(
        `INSERT INTO trips (id, name, departure_time, password, template_id, seat_codes, seat_map, status, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        trip.id,
        trip.tripName,
        trip.departureTime,
        trip.password,
        trip.templateId,
        JSON.stringify(trip.seatCodes),
        JSON.stringify(trip.seatMap),
        trip.status,
        trip.creatorUserId,
        trip.createdAt
      );

      // 同步 tool_states
      this.syncToolStates(trip.id, trip.tools);
    }

    return trip;
  }

  findActiveTripByPassword(password: string): Trip | null {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM trips WHERE password = ? AND status = ?")
      .get(password, "active") as any;
    if (!row) {
      return null;
    }
    return this.rowToTrip(row);
  }

  ensurePasswordAvailable(password: string): void {
    const existing = this.findActiveTripByPassword(password);
    if (existing) {
      throw new BusinessError(
        "PASSWORD_CONFLICT",
        "这个 6 位口令已经被其他车次占用。"
      );
    }
  }

  // ---- TripMember operations ----

  listTripMembers(tripId: string): TripMember[] {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM trip_members WHERE trip_id = ?")
      .all(tripId) as any[];
    return rows.map((row) => ({
      tripId: row.trip_id,
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
    }));
  }

  getTripMember(tripId: string, userId: string): TripMember | null {
    const db = getDb();
    const row = db
      .prepare(
        "SELECT * FROM trip_members WHERE trip_id = ? AND user_id = ?"
      )
      .get(tripId, userId) as any;
    if (!row) {
      return null;
    }
    return {
      tripId: row.trip_id,
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
    };
  }

  addTripMember(
    tripId: string,
    userId: string,
    role: MemberRole,
    joinedAt: number
  ): TripMember {
    const db = getDb();

    // 检查是否已存在
    const existing = this.getTripMember(tripId, userId);
    if (existing) {
      return existing;
    }

    db.prepare(
      "INSERT OR IGNORE INTO trip_members (trip_id, user_id, role, joined_at) VALUES (?, ?, ?, ?)"
    ).run(tripId, userId, role, joinedAt);

    return {
      tripId,
      userId,
      role,
      joinedAt,
    };
  }

  removeTripMember(tripId: string, userId: string): void {
    const db = getDb();
    db.prepare(
      "DELETE FROM trip_members WHERE trip_id = ? AND user_id = ?"
    ).run(tripId, userId);
  }

  removeAllTripMembers(tripId: string): void {
    const db = getDb();
    db.prepare("DELETE FROM trip_members WHERE trip_id = ?").run(tripId);
  }

  // ---- TripFavorite operations ----

  listTripFavorites(tripId: string): TripFavoriteRelation[] {
    const db = getDb();
    const rows = db
      .prepare("SELECT * FROM trip_favorites WHERE trip_id = ?")
      .all(tripId) as any[];
    return rows.map((row) => ({
      tripId: row.trip_id,
      sourceUserId: row.source_user_id,
      targetUserId: row.target_user_id,
      createdAt: row.created_at,
    }));
  }

  hasTripFavorite(
    tripId: string,
    sourceUserId: string,
    targetUserId: string
  ): boolean {
    const db = getDb();
    const row = db
      .prepare(
        "SELECT 1 FROM trip_favorites WHERE trip_id = ? AND source_user_id = ? AND target_user_id = ?"
      )
      .get(tripId, sourceUserId, targetUserId) as any;
    return !!row;
  }

  addTripFavorite(
    tripId: string,
    sourceUserId: string,
    targetUserId: string,
    createdAt: number
  ): TripFavoriteRelation {
    const db = getDb();

    // 检查是否已存在
    const existing = db
      .prepare(
        "SELECT 1 FROM trip_favorites WHERE trip_id = ? AND source_user_id = ? AND target_user_id = ?"
      )
      .get(tripId, sourceUserId, targetUserId) as any;

    if (existing) {
      return {
        tripId,
        sourceUserId,
        targetUserId,
        createdAt,
      };
    }

    db.prepare(
      "INSERT OR IGNORE INTO trip_favorites (trip_id, source_user_id, target_user_id, created_at) VALUES (?, ?, ?, ?)"
    ).run(tripId, sourceUserId, targetUserId, createdAt);

    return {
      tripId,
      sourceUserId,
      targetUserId,
      createdAt,
    };
  }

  removeTripFavorite(
    tripId: string,
    sourceUserId: string,
    targetUserId: string
  ): void {
    const db = getDb();
    db.prepare(
      "DELETE FROM trip_favorites WHERE trip_id = ? AND source_user_id = ? AND target_user_id = ?"
    ).run(tripId, sourceUserId, targetUserId);
  }

  removeTripFavoritesByTrip(tripId: string): void {
    const db = getDb();
    db.prepare("DELETE FROM trip_favorites WHERE trip_id = ?").run(tripId);
  }

  removeTripFavoritesByUserInTrip(tripId: string, userId: string): void {
    const db = getDb();
    db.prepare(
      "DELETE FROM trip_favorites WHERE trip_id = ? AND (source_user_id = ? OR target_user_id = ?)"
    ).run(tripId, userId, userId);
  }

  // ---- Session operations ----

  getActiveUserId(): string {
    return this.currentUserId;
  }

  setActiveUserId(_userId: string): void {
    // Web 版通过 session 管理，此处不做任何操作
  }

  // ---- Private helper methods ----

  private rowToUser(row: any): User {
    return {
      id: row.id,
      nickname: row.nickname,
      avatarUrl: row.avatar_url,
      homePersonaAssetId: row.home_persona_asset_id,
      bio: row.bio,
      livingCity: row.living_city,
      hometown: row.hometown,
      age: row.age,
      tags: JSON.parse(row.tags),
      currentTripId: row.current_trip_id,
      isAuthorized: Boolean(row.is_authorized),
    };
  }

  private rowToTrip(row: any): Trip {
    const db = getDb();
    const toolStateRows = db
      .prepare("SELECT * FROM tool_states WHERE trip_id = ?")
      .all(row.id) as any[];
    const tools = createEmptyTripTools();
    for (const ts of toolStateRows) {
      tools[ts.tool_type as ToolType] = JSON.parse(ts.state_json);
    }

    return {
      id: row.id,
      tripName: row.name,
      departureTime: row.departure_time,
      password: row.password,
      templateId: row.template_id,
      creatorUserId: row.created_by_user_id,
      status: row.status,
      seatCodes: JSON.parse(row.seat_codes),
      seatMap: JSON.parse(row.seat_map),
      tools,
      createdAt: row.created_at,
    };
  }

  private syncUserToDb(user: User): void {
    const db = getDb();
    const now = Date.now();

    const existing = db
      .prepare("SELECT id FROM users WHERE id = ?")
      .get(user.id) as any;

    if (existing) {
      db.prepare(
        `UPDATE users SET nickname=?, avatar_url=?, home_persona_asset_id=?, bio=?, living_city=?, hometown=?, age=?, tags=?, current_trip_id=?, is_authorized=?, updated_at=? WHERE id=?`
      ).run(
        user.nickname,
        user.avatarUrl,
        user.homePersonaAssetId,
        user.bio,
        user.livingCity,
        user.hometown,
        user.age,
        JSON.stringify(user.tags),
        user.currentTripId,
        user.isAuthorized ? 1 : 0,
        now,
        user.id
      );
    } else {
      db.prepare(
        `INSERT INTO users (id, nickname, avatar_url, password_hash, home_persona_asset_id, bio, living_city, hometown, age, tags, current_trip_id, is_authorized, created_at, updated_at) VALUES (?, ?, ?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        user.id,
        user.nickname,
        user.avatarUrl,
        user.homePersonaAssetId,
        user.bio,
        user.livingCity,
        user.hometown,
        user.age,
        JSON.stringify(user.tags),
        user.currentTripId,
        user.isAuthorized ? 1 : 0,
        now,
        now
      );
    }
  }

  private syncTripToDb(trip: Trip): void {
    const db = getDb();

    const existing = db
      .prepare("SELECT id FROM trips WHERE id = ?")
      .get(trip.id) as any;

    if (existing) {
      db.prepare(
        `UPDATE trips SET name=?, departure_time=?, password=?, template_id=?, seat_codes=?, seat_map=?, status=?, created_at=? WHERE id=?`
      ).run(
        trip.tripName,
        trip.departureTime,
        trip.password,
        trip.templateId,
        JSON.stringify(trip.seatCodes),
        JSON.stringify(trip.seatMap),
        trip.status,
        trip.createdAt,
        trip.id
      );
    } else {
      db.prepare(
        `INSERT INTO trips (id, name, departure_time, password, template_id, seat_codes, seat_map, status, created_by_user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        trip.id,
        trip.tripName,
        trip.departureTime,
        trip.password,
        trip.templateId,
        JSON.stringify(trip.seatCodes),
        JSON.stringify(trip.seatMap),
        trip.status,
        trip.creatorUserId,
        trip.createdAt
      );
    }

    // 同步 tool_states
    this.syncToolStates(trip.id, trip.tools);
  }

  private syncToolStates(
    tripId: string,
    tools: Trip["tools"]
  ): void {
    const db = getDb();
    const now = Date.now();

    for (const [toolType, toolState] of Object.entries(tools)) {
      if (toolState) {
        db.prepare(
          `INSERT OR REPLACE INTO tool_states (trip_id, tool_type, state_json, updated_at) VALUES (?, ?, ?, ?)`
        ).run(tripId, toolType, JSON.stringify(toolState), now);
      } else {
        db.prepare(
          `DELETE FROM tool_states WHERE trip_id = ? AND tool_type = ?`
        ).run(tripId, toolType);
      }
    }
  }
}
