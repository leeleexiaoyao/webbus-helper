"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../api-client";

export interface BootstrapData {
  currentUser: {
    id: string;
    nickname: string;
    avatarUrl: string;
    homePersonaAssetId: string | null;
    bio: string;
    livingCity: string;
    hometown: string;
    age: string;
    tags: string[];
    currentTripId: string | null;
    isAuthorized: boolean;
  };
  demoUsers: Array<{
    id: string;
    nickname: string;
    avatarUrl: string;
    initial: string;
    isActive: boolean;
    roleLabel: string;
    currentTripName: string;
    switchLabel: string;
  }>;
  homeMode: "landing" | "trip";
  currentTrip: {
    tripMeta: {
      tripId: string;
      tripName: string;
      departureTime: string;
      password: string;
      templateId: string;
      seatCount: number;
      seatedCount: number;
      memberCount: number;
      viewerRole: string;
      viewerRoleLabel: string;
      viewerRoleClassName: string;
      templateLabel: string;
      isAdmin: boolean;
      viewerSeatCode: string | null;
      viewerSeatLabel: string;
    };
    seatMap: Record<string, any>;
    seatRows: Array<{
      rowNumber: number;
      slots: Array<any>;
    }>;
    members: Array<any>;
  } | null;
}

export function useTrip() {
  const [data, setData] = useState<BootstrapData | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await api.get<BootstrapData>("/api/bootstrap");
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTrip = useCallback(async (input: {
    tripName: string;
    departureTime: string;
    password: string;
    templateId: string;
  }) => {
    await api.post("/api/trips", input);
    await refresh();
  }, [refresh]);

  const joinTrip = useCallback(async (password: string) => {
    await api.post("/api/trips/join", { password });
    await refresh();
  }, [refresh]);

  const claimSeat = useCallback(async (tripId: string, seatCode: string) => {
    await api.post(`/api/seats/${tripId}/claim`, { seatCode });
    await refresh();
  }, [refresh]);

  const switchSeat = useCallback(async (tripId: string, fromSeatCode: string, toSeatCode: string) => {
    await api.post(`/api/seats/${tripId}/switch`, { fromSeatCode, toSeatCode });
    await refresh();
  }, [refresh]);

  const releaseSeat = useCallback(async (tripId: string, seatCode: string) => {
    await api.post(`/api/seats/${tripId}/release`, { seatCode });
    await refresh();
  }, [refresh]);

  return { data, loading, refresh, createTrip, joinTrip, claimSeat, switchSeat, releaseSeat };
}
