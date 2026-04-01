"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  channelType: "general" | "board" | "direct";
  channelId: string;
  timestamp: string;
  read: boolean;
  mentions: string[];
}

interface ChatState {
  messages: ChatMessage[];
  sendMessage: (text: string, channelType: "general" | "board" | "direct", channelId: string, senderId: string, senderName: string, mentions?: string[]) => void;
  getMessages: (channelType: "general" | "board" | "direct", channelId: string) => ChatMessage[];
  markAsRead: (channelType: "general" | "board" | "direct", channelId: string, userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getUnreadCountForChannel: (channelType: "general" | "board" | "direct", channelId: string, userId: string) => number;
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: "cm1", text: "¡Bienvenidos al Marketing Hub! 🚀", senderId: "u1", senderName: "Andrey", channelType: "general", channelId: "general", timestamp: "2026-03-30T10:00:00.000Z", read: true, mentions: [] },
  { id: "cm2", text: "Todo listo para la campaña de Día de la Madre", senderId: "u2", senderName: "María", channelType: "general", channelId: "general", timestamp: "2026-03-30T14:30:00.000Z", read: true, mentions: [] },
  { id: "cm3", text: "Los creativos del carrusel están en revisión", senderId: "u4", senderName: "Ana", channelType: "board", channelId: "b1", timestamp: "2026-03-31T09:15:00.000Z", read: true, mentions: [] },
  { id: "cm4", text: "¿Aprobamos el presupuesto de WildropShop?", senderId: "u3", senderName: "Carlos", channelType: "direct", channelId: "u1", timestamp: "2026-03-31T16:00:00.000Z", read: false, mentions: [] },
];

export const useChatStore = create<ChatState>()(persist((set, get) => ({
  messages: MOCK_MESSAGES,

  sendMessage: (text, channelType, channelId, senderId, senderName, mentions = []) => {
    const msg: ChatMessage = {
      id: `cm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      text, senderId, senderName, channelType, channelId,
      timestamp: new Date().toISOString(), read: false, mentions,
    };
    set((s) => ({ messages: [...s.messages, msg] }));
  },

  getMessages: (channelType, channelId) => {
    const s = get();
    if (channelType === "direct") {
      return s.messages.filter((m) => m.channelType === "direct" && (m.channelId === channelId || (m.senderId === channelId)));
    }
    return s.messages.filter((m) => m.channelType === channelType && m.channelId === channelId);
  },

  markAsRead: (channelType, channelId, userId) => set((s) => ({
    messages: s.messages.map((m) => {
      if (m.senderId === userId) return m;
      if (channelType === "direct") {
        if (m.channelType === "direct" && (m.channelId === userId || m.senderId === channelId)) return { ...m, read: true };
      } else {
        if (m.channelType === channelType && m.channelId === channelId) return { ...m, read: true };
      }
      return m;
    }),
  })),

  getUnreadCount: (userId) => {
    return get().messages.filter((m) => !m.read && m.senderId !== userId).length;
  },

  getUnreadCountForChannel: (channelType, channelId, userId) => {
    const s = get();
    if (channelType === "direct") {
      return s.messages.filter((m) => m.channelType === "direct" && m.senderId === channelId && m.channelId === userId && !m.read).length;
    }
    return s.messages.filter((m) => m.channelType === channelType && m.channelId === channelId && !m.read && m.senderId !== userId).length;
  },
}), {
  name: "mh-chat-storage",
  version: 1,
}));
