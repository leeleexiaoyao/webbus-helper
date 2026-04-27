"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../api-client";
import type { ToolDetailViewModel } from "../../domain/types";

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

  const claimSeat = useCallback(async (seatCode: string) => {
    const tripId = data?.currentTrip?.tripMeta.tripId;
    if (!tripId) throw new Error("No current trip");
    await api.post(`/api/seats/${tripId}/claim`, { seatCode });
    await refresh();
  }, [refresh, data]);

  const switchSeat = useCallback(async (toSeatCode: string) => {
    const tripId = data?.currentTrip?.tripMeta.tripId;
    const fromSeatCode = data?.currentTrip?.tripMeta.viewerSeatCode;
    if (!tripId || !fromSeatCode) throw new Error("No current trip or seat");
    await api.post(`/api/seats/${tripId}/switch`, { fromSeatCode, toSeatCode });
    await refresh();
  }, [refresh, data]);

  const releaseMySeat = useCallback(async () => {
    const tripId = data?.currentTrip?.tripMeta.tripId;
    if (!tripId) throw new Error("No current trip");
    await api.post(`/api/seats/${tripId}/release`, {});
    await refresh();
  }, [refresh, data]);

  const adminReleaseSeat = useCallback(async (userId: string) => {
    const tripId = data?.currentTrip?.tripMeta.tripId;
    if (!tripId) throw new Error("No current trip");
    await api.post(`/api/seats/${tripId}/release`, { userId });
    await refresh();
  }, [refresh, data]);

  const toggleFavoriteMember = useCallback(async (userId: string) => {
    const tripId = data?.currentTrip?.tripMeta.tripId;
    if (!tripId) throw new Error("No current trip");
    await api.post(`/api/favorites/${tripId}`, { userId });
    await refresh();
  }, [refresh, data]);

  // 工具相关方法
  const getToolDetail = useCallback(async (toolType: string) => {
    const tripId = data?.currentTrip?.tripMeta.tripId;
    if (!tripId) throw new Error("No current trip");
    const result = await api.get<ToolDetailViewModel>(`/api/tools/${tripId}/${toolType}`);
    return result;
  }, [data]);

  const toolAction = useCallback(async (toolType: string, action: string, input: any = {}) => {
    const tripId = data?.currentTrip?.tripMeta.tripId;
    if (!tripId) throw new Error("No current trip");
    const result = await api.post(`/api/tools/${tripId}/${toolType}`, { action, ...input });
    await refresh();
    return result;
  }, [refresh, data]);

  const leaveTrip = useCallback(async () => {
    const tripId = data?.currentTrip?.tripMeta.tripId;
    if (!tripId) throw new Error("No current trip");
    await api.post(`/api/members/${tripId}/leave`, {});
    await refresh();
  }, [refresh, data]);

  const dissolveTrip = useCallback(async () => {
    const tripId = data?.currentTrip?.tripMeta.tripId;
    if (!tripId) throw new Error("No current trip");
    await api.post(`/api/members/${tripId}/dissolve`, {});
    await refresh();
  }, [refresh, data]);

  // 获取收藏页面数据
  const getFavoritesPageData = useCallback(async () => {
    const result = await api.get<any>("/api/favorites");
    return result;
  }, []);

  // 获取标签编辑器数据
  const getTagEditorData = useCallback(async () => {
    const result = await api.get<any>("/api/tag-editor");
    return result;
  }, []);

  // 更新个人资料
  const updateProfile = useCallback(async (input: {
    bio: string;
    livingCity: string;
    hometown: string;
    age: string;
    tagsInput: string;
  }) => {
    const result = await api.post<any>("/api/profile", input);
    await refresh();
    return result;
  }, [refresh]);

  // 更新 home persona
  const updateHomePersona = useCallback(async (homePersonaAssetId: string | null) => {
    const result = await api.post<any>("/api/home-persona", { homePersonaAssetId });
    await refresh();
    return result;
  }, [refresh]);

  return { 
    data, loading, refresh, createTrip, joinTrip, claimSeat, switchSeat, 
    releaseMySeat, adminReleaseSeat, toggleFavoriteMember, getToolDetail, 
    toolAction, leaveTrip, dissolveTrip, getFavoritesPageData,
    getTagEditorData, updateProfile, updateHomePersona
  };
}
