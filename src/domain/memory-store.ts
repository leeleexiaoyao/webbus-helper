import { BusinessError } from "./errors";
import type {
  AppState,
  MemberRole,
  Trip,
  TripFavoriteRelation,
  TripMember,
  User
} from "./types";
import { createInitialAppState } from "./constants";
import type { DataStore } from "./repository";

export class MemoryStore implements DataStore {
  private state: AppState;

  constructor(initialState?: AppState) {
    this.state = initialState
      ? JSON.parse(JSON.stringify(initialState))
      : JSON.parse(JSON.stringify(createInitialAppState()));
  }

  // ---- State operations ----

  readState(): AppState {
    return this.state;
  }

  writeState(state: AppState): void {
    this.state = JSON.parse(JSON.stringify(state));
  }

  updateState<T>(updater: (state: AppState) => T): T {
    const result = updater(this.state);
    // state is mutated in-place by updater, so no extra write needed
    return result;
  }

  // ---- User operations ----

  listUsers(): User[] {
    return Object.values(this.state.users);
  }

  getUser(userId: string): User {
    const user = this.state.users[userId];
    if (!user) {
      throw new BusinessError("USER_NOT_FOUND", "未找到当前用户。");
    }
    return user;
  }

  updateUser(userId: string, updater: (user: User) => void): User {
    const user = this.state.users[userId];
    if (!user) {
      throw new BusinessError("USER_NOT_FOUND", "未找到当前用户。");
    }
    updater(user);
    return user;
  }

  setCurrentTripId(userId: string, tripId: string | null): User {
    return this.updateUser(userId, (user) => {
      user.currentTripId = tripId;
    });
  }

  // ---- Trip operations ----

  listTrips(): Trip[] {
    return Object.values(this.state.trips);
  }

  getTrip(tripId: string): Trip {
    const trip = this.state.trips[tripId];
    if (!trip) {
      throw new BusinessError("TRIP_NOT_FOUND", "未找到对应车次。");
    }
    return trip;
  }

  updateTrip(tripId: string, updater: (trip: Trip) => void): Trip {
    const trip = this.state.trips[tripId];
    if (!trip) {
      throw new BusinessError("TRIP_NOT_FOUND", "未找到对应车次。");
    }
    updater(trip);
    return trip;
  }

  saveTrip(trip: Trip): Trip {
    this.state.trips[trip.id] = trip;
    return trip;
  }

  findActiveTripByPassword(password: string): Trip | null {
    return (
      this.listTrips().find((trip) => trip.password === password && trip.status === "active") ?? null
    );
  }

  ensurePasswordAvailable(password: string): void {
    const existing = this.findActiveTripByPassword(password);
    if (existing) {
      throw new BusinessError("PASSWORD_CONFLICT", "这个 6 位口令已经被其他车次占用。");
    }
  }

  // ---- TripMember operations ----

  listTripMembers(tripId: string): TripMember[] {
    return this.state.tripMembers.filter((member) => member.tripId === tripId);
  }

  getTripMember(tripId: string, userId: string): TripMember | null {
    return this.listTripMembers(tripId).find((member) => member.userId === userId) ?? null;
  }

  addTripMember(tripId: string, userId: string, role: MemberRole, joinedAt: number): TripMember {
    const exists = this.state.tripMembers.find(
      (member) => member.tripId === tripId && member.userId === userId
    );
    if (exists) {
      return exists;
    }

    const nextMember: TripMember = {
      tripId,
      userId,
      role,
      joinedAt
    };
    this.state.tripMembers.push(nextMember);
    return nextMember;
  }

  removeTripMember(tripId: string, userId: string): void {
    this.state.tripMembers = this.state.tripMembers.filter(
      (member) => !(member.tripId === tripId && member.userId === userId)
    );
  }

  removeAllTripMembers(tripId: string): void {
    this.state.tripMembers = this.state.tripMembers.filter((member) => member.tripId !== tripId);
  }

  // ---- TripFavorite operations ----

  listTripFavorites(tripId: string): TripFavoriteRelation[] {
    return this.state.tripFavorites.filter((favorite) => favorite.tripId === tripId);
  }

  hasTripFavorite(tripId: string, sourceUserId: string, targetUserId: string): boolean {
    return this.listTripFavorites(tripId).some(
      (favorite) =>
        favorite.sourceUserId === sourceUserId && favorite.targetUserId === targetUserId
    );
  }

  addTripFavorite(
    tripId: string,
    sourceUserId: string,
    targetUserId: string,
    createdAt: number
  ): TripFavoriteRelation {
    const exists = this.state.tripFavorites.find(
      (favorite) =>
        favorite.tripId === tripId &&
        favorite.sourceUserId === sourceUserId &&
        favorite.targetUserId === targetUserId
    );
    if (exists) {
      return exists;
    }

    const nextFavorite: TripFavoriteRelation = {
      tripId,
      sourceUserId,
      targetUserId,
      createdAt
    };
    this.state.tripFavorites.push(nextFavorite);
    return nextFavorite;
  }

  removeTripFavorite(tripId: string, sourceUserId: string, targetUserId: string): void {
    this.state.tripFavorites = this.state.tripFavorites.filter(
      (favorite) =>
        !(
          favorite.tripId === tripId &&
          favorite.sourceUserId === sourceUserId &&
          favorite.targetUserId === targetUserId
        )
    );
  }

  removeTripFavoritesByTrip(tripId: string): void {
    this.state.tripFavorites = this.state.tripFavorites.filter((favorite) => favorite.tripId !== tripId);
  }

  removeTripFavoritesByUserInTrip(tripId: string, userId: string): void {
    this.state.tripFavorites = this.state.tripFavorites.filter(
      (favorite) =>
        favorite.tripId !== tripId ||
        (favorite.sourceUserId !== userId && favorite.targetUserId !== userId)
    );
  }

  // ---- Session operations ----

  getActiveUserId(): string {
    return this.state.activeUserId;
  }

  setActiveUserId(userId: string): void {
    this.state.activeUserId = userId;
  }
}
