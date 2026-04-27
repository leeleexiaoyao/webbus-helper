"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../api-client";

export interface AuthUser {
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
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: AuthUser | null }>("/api/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (nickname: string, password: string) => {
    const data = await api.post<{ user: AuthUser }>("/api/auth/login", { nickname, password });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (nickname: string, password: string, avatarUrl?: string) => {
    const data = await api.post<{ user: AuthUser }>("/api/auth/register", { nickname, password, avatarUrl });
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const data = await api.upload<{ avatarUrl: string }>("/api/upload/avatar", formData);
    if (user) {
      setUser({ ...user, avatarUrl: data.avatarUrl });
    }
    return data.avatarUrl;
  }, [user]);

  return { user, loading, login, register, logout, uploadAvatar, refresh };
}
