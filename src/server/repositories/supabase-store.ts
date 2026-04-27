import { MemoryStore } from "@/src/domain/memory-store";
import {
  APP_STATE_VERSION,
  createEmptyTripTools,
} from "@/src/domain/constants";
import type { DataStore } from "@/src/domain/repository";
import type {
  AppState,
  MemberRole,
  ToolType,
  Trip,
  TripFavoriteRelation,
  TripMember,
  User,
} from "@/src/domain/types";
import { getSupabaseAdmin } from "@/src/server/supabase";

type UserRow = {
  id: string;
  nickname: string;
  avatar_url: string;
  home_persona_asset_id: string | null;
  bio: string;
  living_city: string;
  hometown: string;
  age: string;
  tags: string[] | null;
  current_trip_id: string | null;
  is_authorized: boolean;
  created_at: number;
  updated_at: number;
};

type TripRow = {
  id: string;
  name: string;
  departure_time: string;
  password: string;
  template_id: Trip["templateId"];
  seat_codes: string[] | null;
  seat_map: Record<string, string | null> | null;
  status: Trip["status"];
  created_by_user_id: string;
  created_at: number;
};

type TripMemberRow = {
  trip_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: number;
};

type TripFavoriteRow = {
  trip_id: string;
  source_user_id: string;
  target_user_id: string;
  created_at: number;
};

type ToolStateRow = {
  trip_id: string;
  tool_type: ToolType;
  state_json: Trip["tools"][ToolType];
  updated_at: number;
};

type SnapshotKeys = {
  userIds: Set<string>;
  tripIds: Set<string>;
  tripMemberKeys: Set<string>;
  tripFavoriteKeys: Set<string>;
  toolStateKeys: Set<string>;
};

type UserRecordMeta = {
  passwordHash: string;
  createdAt: number;
  updatedAt: number;
};

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toComparableState(state: AppState): string {
  return JSON.stringify(state);
}

function buildSnapshotKeys(state: AppState): SnapshotKeys {
  const tripMemberKeys = new Set(
    state.tripMembers.map((member) => `${member.tripId}:${member.userId}`)
  );
  const tripFavoriteKeys = new Set(
    state.tripFavorites.map(
      (favorite) =>
        `${favorite.tripId}:${favorite.sourceUserId}:${favorite.targetUserId}`
    )
  );
  const toolStateKeys = new Set<string>();

  Object.values(state.trips).forEach((trip) => {
    (Object.entries(trip.tools) as Array<[ToolType, Trip["tools"][ToolType]]>).forEach(
      ([toolType, toolState]) => {
        if (toolState) {
          toolStateKeys.add(`${trip.id}:${toolType}`);
        }
      }
    );
  });

  return {
    userIds: new Set(Object.keys(state.users)),
    tripIds: new Set(Object.keys(state.trips)),
    tripMemberKeys,
    tripFavoriteKeys,
    toolStateKeys,
  };
}

function buildAppState(
  activeUserId: string,
  users: UserRow[],
  trips: TripRow[],
  tripMembers: TripMemberRow[],
  tripFavorites: TripFavoriteRow[],
  toolStates: ToolStateRow[]
): AppState {
  const usersById = users.reduce<Record<string, User>>((accumulator, row) => {
    accumulator[row.id] = {
      id: row.id,
      nickname: row.nickname,
      avatarUrl: row.avatar_url,
      homePersonaAssetId: row.home_persona_asset_id,
      bio: row.bio,
      livingCity: row.living_city,
      hometown: row.hometown,
      age: row.age,
      tags: Array.isArray(row.tags) ? row.tags : [],
      currentTripId: row.current_trip_id,
      isAuthorized: Boolean(row.is_authorized),
    };
    return accumulator;
  }, {});

  const tripsById = trips.reduce<Record<string, Trip>>((accumulator, row) => {
    accumulator[row.id] = {
      id: row.id,
      tripName: row.name,
      departureTime: row.departure_time,
      password: row.password,
      templateId: row.template_id,
      creatorUserId: row.created_by_user_id,
      status: row.status,
      seatCodes: Array.isArray(row.seat_codes) ? row.seat_codes : [],
      seatMap: row.seat_map ?? {},
      tools: createEmptyTripTools(),
      createdAt: row.created_at,
    };
    return accumulator;
  }, {});

  toolStates.forEach((row) => {
    const trip = tripsById[row.trip_id];
    if (!trip) {
      return;
    }
    trip.tools[row.tool_type] = row.state_json ?? null;
  });

  return {
    version: APP_STATE_VERSION,
    users: usersById,
    trips: tripsById,
    tripMembers: tripMembers.map((row) => ({
      tripId: row.trip_id,
      userId: row.user_id,
      role: row.role,
      joinedAt: row.joined_at,
    })),
    tripFavorites: tripFavorites.map((row) => ({
      tripId: row.trip_id,
      sourceUserId: row.source_user_id,
      targetUserId: row.target_user_id,
      createdAt: row.created_at,
    })),
    activeUserId,
  };
}

export class SupabaseStore implements DataStore {
  private readonly memoryStore: MemoryStore;
  private readonly initialKeys: SnapshotKeys;
  private readonly userRecordMeta: Record<string, UserRecordMeta>;
  private dirty = false;

  private constructor(
    state: AppState,
    userRecordMeta: Record<string, UserRecordMeta>
  ) {
    this.memoryStore = new MemoryStore(state);
    this.initialKeys = buildSnapshotKeys(state);
    this.userRecordMeta = userRecordMeta;
  }

  static async create(activeUserId: string): Promise<SupabaseStore> {
    const supabaseAdmin = getSupabaseAdmin();
    const [
      usersResult,
      tripsResult,
      tripMembersResult,
      tripFavoritesResult,
      toolStatesResult,
    ] = await Promise.all([
      supabaseAdmin.from("users").select(
        "id, nickname, avatar_url, password_hash, home_persona_asset_id, bio, living_city, hometown, age, tags, current_trip_id, is_authorized, created_at, updated_at"
      ),
      supabaseAdmin.from("trips").select(
        "id, name, departure_time, password, template_id, seat_codes, seat_map, status, created_by_user_id, created_at"
      ),
      supabaseAdmin.from("trip_members").select(
        "trip_id, user_id, role, joined_at"
      ),
      supabaseAdmin.from("trip_favorites").select(
        "trip_id, source_user_id, target_user_id, created_at"
      ),
      supabaseAdmin.from("tool_states").select(
        "trip_id, tool_type, state_json, updated_at"
      ),
    ]);

    if (usersResult.error) throw usersResult.error;
    if (tripsResult.error) throw tripsResult.error;
    if (tripMembersResult.error) throw tripMembersResult.error;
    if (tripFavoritesResult.error) throw tripFavoritesResult.error;
    if (toolStatesResult.error) throw toolStatesResult.error;

    const state = buildAppState(
      activeUserId,
      (usersResult.data ?? []) as UserRow[],
      (tripsResult.data ?? []) as TripRow[],
      (tripMembersResult.data ?? []) as TripMemberRow[],
      (tripFavoritesResult.data ?? []) as TripFavoriteRow[],
      (toolStatesResult.data ?? []) as ToolStateRow[]
    );

    const userRecordMeta = ((usersResult.data ?? []) as Array<
      UserRow & { password_hash?: string }
    >).reduce<Record<string, UserRecordMeta>>((accumulator, row) => {
      accumulator[row.id] = {
        passwordHash: row.password_hash ?? "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
      return accumulator;
    }, {});

    return new SupabaseStore(state, userRecordMeta);
  }

  isDirty(): boolean {
    return this.dirty;
  }

  async flush(): Promise<void> {
    if (!this.dirty) {
      return;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const state = cloneState(this.memoryStore.readState());
    const nextKeys = buildSnapshotKeys(state);
    const now = Date.now();

    const userRows = Object.values(state.users).map((user) => {
      const recordMeta = this.userRecordMeta[user.id];
      return {
        id: user.id,
        nickname: user.nickname,
        avatar_url: user.avatarUrl,
        password_hash: recordMeta?.passwordHash ?? "",
        home_persona_asset_id: user.homePersonaAssetId,
        bio: user.bio,
        living_city: user.livingCity,
        hometown: user.hometown,
        age: user.age,
        tags: user.tags,
        current_trip_id: user.currentTripId,
        is_authorized: user.isAuthorized,
        created_at: recordMeta?.createdAt ?? now,
        updated_at: now,
      };
    });

    const tripRows = Object.values(state.trips).map((trip) => ({
      id: trip.id,
      name: trip.tripName,
      departure_time: trip.departureTime,
      password: trip.password,
      template_id: trip.templateId,
      seat_codes: trip.seatCodes,
      seat_map: trip.seatMap,
      status: trip.status,
      created_by_user_id: trip.creatorUserId,
      created_at: trip.createdAt,
    }));

    const tripMemberRows = state.tripMembers.map((member) => ({
      trip_id: member.tripId,
      user_id: member.userId,
      role: member.role,
      joined_at: member.joinedAt,
    }));

    const tripFavoriteRows = state.tripFavorites.map((favorite) => ({
      trip_id: favorite.tripId,
      source_user_id: favorite.sourceUserId,
      target_user_id: favorite.targetUserId,
      created_at: favorite.createdAt,
    }));

    const toolStateRows = Object.values(state.trips).flatMap((trip) =>
      (Object.entries(trip.tools) as Array<[ToolType, Trip["tools"][ToolType]]>)
        .filter(([, toolState]) => Boolean(toolState))
        .map(([toolType, toolState]) => ({
          trip_id: trip.id,
          tool_type: toolType,
          state_json: toolState,
          updated_at: now,
        }))
    );

    await Promise.all(
      Array.from(this.initialKeys.tripMemberKeys)
        .filter((key) => !nextKeys.tripMemberKeys.has(key))
        .map(async (key) => {
          const [tripId, userId] = key.split(":");
          const { error } = await supabaseAdmin
            .from("trip_members")
            .delete()
            .eq("trip_id", tripId)
            .eq("user_id", userId);
          if (error) throw error;
        })
    );

    await Promise.all(
      Array.from(this.initialKeys.tripFavoriteKeys)
        .filter((key) => !nextKeys.tripFavoriteKeys.has(key))
        .map(async (key) => {
          const [tripId, sourceUserId, targetUserId] = key.split(":");
          const { error } = await supabaseAdmin
            .from("trip_favorites")
            .delete()
            .eq("trip_id", tripId)
            .eq("source_user_id", sourceUserId)
            .eq("target_user_id", targetUserId);
          if (error) throw error;
        })
    );

    await Promise.all(
      Array.from(this.initialKeys.toolStateKeys)
        .filter((key) => !nextKeys.toolStateKeys.has(key))
        .map(async (key) => {
          const [tripId, toolType] = key.split(":");
          const { error } = await supabaseAdmin
            .from("tool_states")
            .delete()
            .eq("trip_id", tripId)
            .eq("tool_type", toolType);
          if (error) throw error;
        })
    );

    await Promise.all(
      Array.from(this.initialKeys.tripIds)
        .filter((id) => !nextKeys.tripIds.has(id))
        .map(async (tripId) => {
          const { error } = await supabaseAdmin
            .from("trips")
            .delete()
            .eq("id", tripId);
          if (error) throw error;
        })
    );

    await Promise.all(
      Array.from(this.initialKeys.userIds)
        .filter((id) => !nextKeys.userIds.has(id))
        .map(async (userId) => {
          const { error } = await supabaseAdmin
            .from("users")
            .delete()
            .eq("id", userId);
          if (error) throw error;
        })
    );

    if (userRows.length) {
      const { error } = await supabaseAdmin
        .from("users")
        .upsert(userRows, { onConflict: "id" });
      if (error) throw error;
      userRows.forEach((row) => {
        this.userRecordMeta[row.id] = {
          passwordHash: row.password_hash,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      });
    }

    if (tripRows.length) {
      const { error } = await supabaseAdmin
        .from("trips")
        .upsert(tripRows, { onConflict: "id" });
      if (error) throw error;
    }

    if (tripMemberRows.length) {
      const { error } = await supabaseAdmin
        .from("trip_members")
        .upsert(tripMemberRows, { onConflict: "trip_id,user_id" });
      if (error) throw error;
    }

    if (tripFavoriteRows.length) {
      const { error } = await supabaseAdmin
        .from("trip_favorites")
        .upsert(tripFavoriteRows, {
          onConflict: "trip_id,source_user_id,target_user_id",
        });
      if (error) throw error;
    }

    if (toolStateRows.length) {
      const { error } = await supabaseAdmin
        .from("tool_states")
        .upsert(toolStateRows, { onConflict: "trip_id,tool_type" });
      if (error) throw error;
    }

    this.dirty = false;
  }

  readState(): AppState {
    return this.memoryStore.readState();
  }

  writeState(state: AppState): void {
    this.dirty =
      this.dirty ||
      toComparableState(this.memoryStore.readState()) !== toComparableState(state);
    this.memoryStore.writeState(state);
  }

  updateState<T>(updater: (state: AppState) => T): T {
    const before = toComparableState(this.memoryStore.readState());
    const result = this.memoryStore.updateState(updater);
    const after = toComparableState(this.memoryStore.readState());
    if (before !== after) {
      this.dirty = true;
    }
    return result;
  }

  listUsers(): User[] {
    return this.memoryStore.listUsers();
  }

  getUser(userId: string): User {
    return this.memoryStore.getUser(userId);
  }

  updateUser(userId: string, updater: (user: User) => void): User {
    this.dirty = true;
    return this.memoryStore.updateUser(userId, updater);
  }

  setCurrentTripId(userId: string, tripId: string | null): User {
    this.dirty = true;
    return this.memoryStore.setCurrentTripId(userId, tripId);
  }

  listTrips(): Trip[] {
    return this.memoryStore.listTrips();
  }

  getTrip(tripId: string): Trip {
    return this.memoryStore.getTrip(tripId);
  }

  updateTrip(tripId: string, updater: (trip: Trip) => void): Trip {
    this.dirty = true;
    return this.memoryStore.updateTrip(tripId, updater);
  }

  saveTrip(trip: Trip): Trip {
    this.dirty = true;
    return this.memoryStore.saveTrip(trip);
  }

  findActiveTripByPassword(password: string): Trip | null {
    return this.memoryStore.findActiveTripByPassword(password);
  }

  ensurePasswordAvailable(password: string): void {
    this.memoryStore.ensurePasswordAvailable(password);
  }

  listTripMembers(tripId: string): TripMember[] {
    return this.memoryStore.listTripMembers(tripId);
  }

  getTripMember(tripId: string, userId: string): TripMember | null {
    return this.memoryStore.getTripMember(tripId, userId);
  }

  addTripMember(
    tripId: string,
    userId: string,
    role: MemberRole,
    joinedAt: number
  ): TripMember {
    this.dirty = true;
    return this.memoryStore.addTripMember(tripId, userId, role, joinedAt);
  }

  removeTripMember(tripId: string, userId: string): void {
    this.dirty = true;
    this.memoryStore.removeTripMember(tripId, userId);
  }

  removeAllTripMembers(tripId: string): void {
    this.dirty = true;
    this.memoryStore.removeAllTripMembers(tripId);
  }

  listTripFavorites(tripId: string): TripFavoriteRelation[] {
    return this.memoryStore.listTripFavorites(tripId);
  }

  hasTripFavorite(
    tripId: string,
    sourceUserId: string,
    targetUserId: string
  ): boolean {
    return this.memoryStore.hasTripFavorite(tripId, sourceUserId, targetUserId);
  }

  addTripFavorite(
    tripId: string,
    sourceUserId: string,
    targetUserId: string,
    createdAt: number
  ): TripFavoriteRelation {
    this.dirty = true;
    return this.memoryStore.addTripFavorite(
      tripId,
      sourceUserId,
      targetUserId,
      createdAt
    );
  }

  removeTripFavorite(
    tripId: string,
    sourceUserId: string,
    targetUserId: string
  ): void {
    this.dirty = true;
    this.memoryStore.removeTripFavorite(tripId, sourceUserId, targetUserId);
  }

  removeTripFavoritesByTrip(tripId: string): void {
    this.dirty = true;
    this.memoryStore.removeTripFavoritesByTrip(tripId);
  }

  removeTripFavoritesByUserInTrip(tripId: string, userId: string): void {
    this.dirty = true;
    this.memoryStore.removeTripFavoritesByUserInTrip(tripId, userId);
  }

  getActiveUserId(): string {
    return this.memoryStore.getActiveUserId();
  }

  setActiveUserId(userId: string): void {
    this.memoryStore.setActiveUserId(userId);
  }
}
