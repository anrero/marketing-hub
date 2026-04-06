"use client";

import { create } from "zustand";

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
  _loaded: Record<string, boolean>;
  loadMessages: (channelType: "general" | "board" | "direct", channelId: string, userId?: string) => Promise<void>;
  sendMessage: (text: string, channelType: "general" | "board" | "direct", channelId: string, senderId: string, senderName: string, mentions?: string[]) => void;
  getMessages: (channelType: "general" | "board" | "direct", channelId: string) => ChatMessage[];
  markAsRead: (channelType: "general" | "board" | "direct", channelId: string, userId: string) => void;
  getUnreadCount: (userId: string) => number;
  getUnreadCountForChannel: (channelType: "general" | "board" | "direct", channelId: string, userId: string) => number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformApiMessage(msg: any): ChatMessage {
  return {
    id: msg.id,
    text: msg.text,
    senderId: msg.senderId,
    senderName: msg.sender?.name || msg.senderId,
    channelType: msg.channelType as "general" | "board" | "direct",
    channelId: msg.channelId,
    timestamp: msg.createdAt,
    read: msg.read,
    mentions: [],
  };
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages: [],
  _loaded: {},

  loadMessages: async (channelType, channelId, userId) => {
    const key = `${channelType}:${channelId}`;
    try {
      const params = new URLSearchParams({ channelType, channelId });
      if (userId) params.set("userId", userId);
      const res = await fetch(`/api/chat?${params}`);
      if (!res.ok) return;
      const apiMessages = await res.json();
      const newMessages = apiMessages.map(transformApiMessage);
      set((s) => {
        // Remove old messages for this channel and add fresh ones
        const otherMessages = s.messages.filter((m) =>
          !(m.channelType === channelType && m.channelId === channelId)
        );
        return {
          messages: [...otherMessages, ...newMessages],
          _loaded: { ...s._loaded, [key]: true },
        };
      });
    } catch (e) {
      console.error("Error loading chat messages:", e);
    }
  },

  sendMessage: (text, channelType, channelId, senderId, senderName, mentions = []) => {
    const tempId = `cm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const msg: ChatMessage = {
      id: tempId,
      text, senderId, senderName, channelType, channelId,
      timestamp: new Date().toISOString(), read: false, mentions,
    };
    set((s) => ({ messages: [...s.messages, msg] }));
    // Persist to server
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, channelType, channelId, senderId }),
    }).then((r) => r.json()).then((saved) => {
      const serverMsg = transformApiMessage(saved);
      set((s) => ({
        messages: s.messages.map((m) => m.id === tempId ? serverMsg : m),
      }));
    }).catch((e) => console.error("API send message error:", e));
  },

  getMessages: (channelType, channelId) => {
    const s = get();
    if (channelType === "direct") {
      return s.messages.filter((m) => m.channelType === "direct" && (m.channelId === channelId || (m.senderId === channelId)));
    }
    return s.messages.filter((m) => m.channelType === channelType && m.channelId === channelId);
  },

  markAsRead: (channelType, channelId, userId) => {
    set((s) => ({
      messages: s.messages.map((m) => {
        if (m.senderId === userId) return m;
        if (channelType === "direct") {
          if (m.channelType === "direct" && (m.channelId === userId || m.senderId === channelId)) return { ...m, read: true };
        } else {
          if (m.channelType === channelType && m.channelId === channelId) return { ...m, read: true };
        }
        return m;
      }),
    }));
    // Persist to server
    fetch("/api/chat/read", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelType, channelId, userId }),
    }).catch((e) => console.error("API mark read error:", e));
  },

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
}));
