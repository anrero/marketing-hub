"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string; // btoa encoded
  avatar: string;
  role: "owner" | "admin" | "editor" | "viewer";
  color?: string;
  createdAt: string;
}

export interface CurrentSession {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  color?: string;
}

const AVATAR_COLORS = [
  "bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-pink-600",
  "bg-amber-600", "bg-cyan-600", "bg-red-600", "bg-indigo-600",
];

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function pickColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = ((hash << 5) - hash + email.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Default demo users
const DEFAULT_USERS: AuthUser[] = [
  { id: "u1", name: "Andrey", email: "andrey@redking.co", password: btoa("admin123"), avatar: "A", role: "owner", color: "bg-blue-600", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "u2", name: "María", email: "maria@redking.co", password: btoa("maria123"), avatar: "M", role: "editor", color: "bg-purple-600", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "u3", name: "Carlos", email: "carlos@redking.co", password: btoa("carlos123"), avatar: "C", role: "editor", color: "bg-emerald-600", createdAt: "2024-01-01T00:00:00.000Z" },
  { id: "u4", name: "Ana", email: "ana@redking.co", password: btoa("ana123"), avatar: "AN", role: "editor", color: "bg-pink-600", createdAt: "2024-01-01T00:00:00.000Z" },
];

interface AuthState {
  users: AuthUser[];
  currentUser: CurrentSession | null;

  register: (name: string, email: string, password: string) => { success: boolean; error?: string };
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<Pick<CurrentSession, "name" | "email" | "color">>) => void;
  changePassword: (oldPassword: string, newPassword: string) => { success: boolean; error?: string };
}

export const useAuthStore = create<AuthState>()(persist((set, get) => ({
  users: DEFAULT_USERS,
  currentUser: null,

  register: (name, email, password) => {
    const state = get();
    if (state.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: "Este email ya está registrado" };
    }
    if (password.length < 6) {
      return { success: false, error: "La contraseña debe tener al menos 6 caracteres" };
    }
    const id = `u_${Date.now()}`;
    const avatar = getInitials(name);
    const color = pickColor(email);
    const newUser: AuthUser = {
      id, name, email: email.toLowerCase(), password: btoa(password),
      avatar, role: state.users.length === 0 ? "owner" : "editor",
      color, createdAt: new Date().toISOString(),
    };
    const session: CurrentSession = { id, name, email: email.toLowerCase(), role: newUser.role, avatar, color };
    set({ users: [...state.users, newUser], currentUser: session });
    return { success: true };
  },

  login: (email, password) => {
    const state = get();
    const user = state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: "Email no encontrado" };
    if (user.password !== btoa(password)) return { success: false, error: "Contraseña incorrecta" };
    const session: CurrentSession = { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, color: user.color };
    set({ currentUser: session });
    return { success: true };
  },

  logout: () => set({ currentUser: null }),

  updateProfile: (updates) => {
    const state = get();
    if (!state.currentUser) return;
    const newSession = { ...state.currentUser, ...updates };
    const newUsers = state.users.map((u) =>
      u.id === state.currentUser!.id
        ? { ...u, name: newSession.name, email: newSession.email, avatar: getInitials(newSession.name), color: newSession.color }
        : u,
    );
    set({
      currentUser: { ...newSession, avatar: getInitials(newSession.name) },
      users: newUsers,
    });
  },

  changePassword: (oldPassword, newPassword) => {
    const state = get();
    if (!state.currentUser) return { success: false, error: "No hay sesión activa" };
    const user = state.users.find((u) => u.id === state.currentUser!.id);
    if (!user) return { success: false, error: "Usuario no encontrado" };
    if (user.password !== btoa(oldPassword)) return { success: false, error: "Contraseña actual incorrecta" };
    if (newPassword.length < 6) return { success: false, error: "La nueva contraseña debe tener al menos 6 caracteres" };
    set({ users: state.users.map((u) => u.id === state.currentUser!.id ? { ...u, password: btoa(newPassword) } : u) });
    return { success: true };
  },
}), {
  name: "mh-auth-storage",
  version: 1,
}));
