"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CurrentSession {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarColor: string;
  workspaceId: string | null;
}

interface AuthState {
  currentUser: CurrentSession | null;
  isLoading: boolean;
  isCheckingSession: boolean;

  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkSession: () => Promise<boolean>;
  updateProfile: (updates: Partial<Pick<CurrentSession, "name" | "email" | "avatarColor">>) => void;
}

export const useAuthStore = create<AuthState>()(persist((set, get) => ({
  currentUser: null,
  isLoading: false,
  isCheckingSession: false,

  register: async (name, email, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false });
        return { success: false, error: data.error || "Error al crear cuenta" };
      }
      const session: CurrentSession = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatarColor: data.avatarColor,
        workspaceId: data.workspaceId,
      };
      set({ currentUser: session, isLoading: false });
      return { success: true };
    } catch {
      set({ isLoading: false });
      return { success: false, error: "Error de conexión con el servidor" };
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false });
        return { success: false, error: data.error || "Error al iniciar sesión" };
      }
      const session: CurrentSession = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        avatarColor: data.avatarColor,
        workspaceId: data.workspaceId,
      };
      set({ currentUser: session, isLoading: false });
      return { success: true };
    } catch {
      set({ isLoading: false });
      return { success: false, error: "Error de conexión con el servidor" };
    }
  },

  logout: () => {
    // 1. Clear server-side session cookie
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // 2. Wipe ALL app data from localStorage
    try {
      localStorage.removeItem("mh-auth-storage");
      localStorage.removeItem("mh-board-storage");
      localStorage.removeItem("mh-sidebar-storage");
      localStorage.removeItem("mh-table-columns-storage");
    } catch { /* ignore */ }
    // 3. Hard reload — nukes all React state, Zustand memory, and persist rehydration
    window.location.href = "/";
  },

  checkSession: async () => {
    const state = get();
    if (!state.currentUser) return false;
    set({ isCheckingSession: true });
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        set({ currentUser: null, isCheckingSession: false });
        return false;
      }
      const data = await res.json();
      set({
        currentUser: {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          avatarColor: data.avatarColor,
          workspaceId: data.workspaceId,
        },
        isCheckingSession: false,
      });
      return true;
    } catch {
      set({ isCheckingSession: false });
      return false;
    }
  },

  updateProfile: (updates) => {
    const state = get();
    if (!state.currentUser) return;
    set({ currentUser: { ...state.currentUser, ...updates } });
    // Persist to server
    fetch("/api/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch((e) => console.error("API update profile error:", e));
  },
}), {
  name: "mh-auth-storage",
  version: 3,
  partialize: (state) => ({
    currentUser: state.currentUser,
  }),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  migrate: (persisted: any) => {
    // Wipe old users array and password data from v1
    if (persisted && typeof persisted === "object") {
      delete persisted.users;
      // If currentUser has old shape (avatar instead of avatarColor), wipe it
      if (persisted.currentUser && !persisted.currentUser.workspaceId) {
        persisted.currentUser = null;
      }
    }
    return persisted;
  },
}));
