"use client";

import { create } from "zustand";

interface UndoEntry {
  type: string;
  description: string;
  undo: () => void;
  redo: () => void;
}

interface HistoryStore {
  past: UndoEntry[];
  future: UndoEntry[];
  canUndo: boolean;
  canRedo: boolean;
  pushAction: (entry: UndoEntry) => void;
  undo: () => void;
  redo: () => void;
}

const MAX_HISTORY = 30;

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,

  pushAction: (entry) => set((s) => {
    const newPast = [...s.past, entry].slice(-MAX_HISTORY);
    return { past: newPast, future: [], canUndo: true, canRedo: false };
  }),

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;
    const entry = past[past.length - 1];
    entry.undo();
    const newPast = past.slice(0, -1);
    set({
      past: newPast,
      future: [entry, ...future],
      canUndo: newPast.length > 0,
      canRedo: true,
    });
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;
    const entry = future[0];
    entry.redo();
    const newFuture = future.slice(1);
    set({
      past: [...past, entry],
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });
  },
}));
