import type {
  User,
  Trip,
  TripMember,
  TripFavoriteRelation,
  MemberRole,
  AppState
} from "./types";

export interface DataStore {
  // User operations
  listUsers(): User[];
  getUser(userId: string): User;
  updateUser(userId: string, updater: (user: User) => void): User;
  setCurrentTripId(userId: string, tripId: string | null): User;

  // Trip operations
  listTrips(): Trip[];
  getTrip(tripId: string): Trip;
  updateTrip(tripId: string, updater: (trip: Trip) => void): Trip;
  saveTrip(trip: Trip): Trip;
  findActiveTripByPassword(password: string): Trip | null;
  ensurePasswordAvailable(password: string): void;

  // TripMember operations
  listTripMembers(tripId: string): TripMember[];
  getTripMember(tripId: string, userId: string): TripMember | null;
  addTripMember(tripId: string, userId: string, role: MemberRole, joinedAt: number): TripMember;
  removeTripMember(tripId: string, userId: string): void;
  removeAllTripMembers(tripId: string): void;

  // TripFavorite operations
  listTripFavorites(tripId: string): TripFavoriteRelation[];
  hasTripFavorite(tripId: string, sourceUserId: string, targetUserId: string): boolean;
  addTripFavorite(tripId: string, sourceUserId: string, targetUserId: string, createdAt: number): TripFavoriteRelation;
  removeTripFavorite(tripId: string, sourceUserId: string, targetUserId: string): void;
  removeTripFavoritesByTrip(tripId: string): void;
  removeTripFavoritesByUserInTrip(tripId: string, userId: string): void;

  // Session operations
  getActiveUserId(): string;
  setActiveUserId(userId: string): void;

  // State operations (for atomic updates)
  updateState<T>(updater: (state: AppState) => T): T;
  readState(): AppState;
  writeState(state: AppState): void;
}
