"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TableColumnDef, CustomColumnType } from "@/types";

const BUILT_IN_COLUMNS: TableColumnDef[] = [
  { id: "title", builtIn: true, key: "title", label: "Título", visible: true, pinned: false, width: 280, order: 0 },
  { id: "status", builtIn: true, key: "status", label: "Status", visible: true, pinned: false, width: 120, order: 1 },
  { id: "store", builtIn: true, key: "store", label: "Tienda", visible: true, pinned: false, width: 120, order: 2 },
  { id: "adAccount", builtIn: true, key: "adAccount", label: "Cuenta Pub.", visible: true, pinned: false, width: 140, order: 3 },
  { id: "campaignType", builtIn: true, key: "campaignType", label: "Tipo Campaña", visible: true, pinned: false, width: 130, order: 4 },
  { id: "priority", builtIn: true, key: "priority", label: "Prioridad", visible: true, pinned: false, width: 100, order: 5 },
  { id: "assigneeId", builtIn: true, key: "assigneeId", label: "Responsable", visible: true, pinned: false, width: 120, order: 6 },
  { id: "dueDate", builtIn: true, key: "dueDate", label: "Fecha", visible: true, pinned: false, width: 90, order: 7 },
];

interface TableColumnsState {
  columns: TableColumnDef[];
  columnFilters: Record<string, string[]>;

  renameColumn: (id: string, label: string) => void;
  toggleVisibility: (id: string) => void;
  setAllVisibility: (visMap: Record<string, boolean>) => void;
  togglePin: (id: string) => void;
  setColumnWidth: (id: string, width: number) => void;
  addCustomColumn: (insertAfterId: string, position: "left" | "right", type: CustomColumnType, label: string, selectOptions?: string[]) => void;
  removeCustomColumn: (id: string) => void;
  setColumnFilter: (id: string, values: string[]) => void;
  clearColumnFilter: (id: string) => void;
  clearAllColumnFilters: () => void;

  getVisibleColumns: () => TableColumnDef[];
  getPinnedColumnIds: () => string[];
}

export const useTableColumnsStore = create<TableColumnsState>()(persist((set, get) => ({
  columns: BUILT_IN_COLUMNS.map((c) => ({ ...c })),
  columnFilters: {},

  renameColumn: (id, label) =>
    set((s) => ({
      columns: s.columns.map((c) => (c.id === id ? { ...c, label } : c)),
    })),

  toggleVisibility: (id) =>
    set((s) => ({
      columns: s.columns.map((c) =>
        c.id === id ? { ...c, visible: !c.visible, pinned: !c.visible ? c.pinned : false } : c
      ),
    })),

  setAllVisibility: (visMap) =>
    set((s) => ({
      columns: s.columns.map((c) => {
        const v = visMap[c.id];
        if (v === undefined) return c;
        return { ...c, visible: v, pinned: v ? c.pinned : false };
      }),
    })),

  togglePin: (id) =>
    set((s) => {
      const col = s.columns.find((c) => c.id === id);
      if (!col || !col.visible) return s;
      const currentPinned = s.columns.filter((c) => c.pinned);
      if (!col.pinned && currentPinned.length >= 2) return s;
      return {
        columns: s.columns.map((c) =>
          c.id === id ? { ...c, pinned: !c.pinned } : c
        ),
      };
    }),

  setColumnWidth: (id, width) =>
    set((s) => ({
      columns: s.columns.map((c) =>
        c.id === id ? { ...c, width: Math.min(500, Math.max(80, width)) } : c
      ),
    })),

  addCustomColumn: (insertAfterId, position, type, label, selectOptions) =>
    set((s) => {
      const newId = `custom_${Date.now()}`;
      const refIdx = s.columns.findIndex((c) => c.id === insertAfterId);
      const insertIdx = position === "right" ? refIdx + 1 : refIdx;
      const newCol: TableColumnDef = {
        id: newId,
        builtIn: false,
        key: newId,
        label,
        customType: type,
        selectOptions: selectOptions ?? [],
        visible: true,
        pinned: false,
        width: 140,
        order: 0,
      };
      const cols = [...s.columns];
      cols.splice(insertIdx, 0, newCol);
      return { columns: cols.map((c, i) => ({ ...c, order: i })) };
    }),

  removeCustomColumn: (id) =>
    set((s) => {
      const col = s.columns.find((c) => c.id === id);
      if (!col || col.builtIn) return s;
      const filters = { ...s.columnFilters };
      delete filters[id];
      return {
        columns: s.columns.filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i })),
        columnFilters: filters,
      };
    }),

  setColumnFilter: (id, values) =>
    set((s) => ({
      columnFilters: { ...s.columnFilters, [id]: values },
    })),

  clearColumnFilter: (id) =>
    set((s) => {
      const f = { ...s.columnFilters };
      delete f[id];
      return { columnFilters: f };
    }),

  clearAllColumnFilters: () => set({ columnFilters: {} }),

  getVisibleColumns: () => {
    const s = get();
    const pinned = s.columns.filter((c) => c.visible && c.pinned).sort((a, b) => a.order - b.order);
    const unpinned = s.columns.filter((c) => c.visible && !c.pinned).sort((a, b) => a.order - b.order);
    return [...pinned, ...unpinned];
  },

  getPinnedColumnIds: () => {
    return get().columns.filter((c) => c.pinned).map((c) => c.id);
  },
}), {
  name: "mh-table-columns-storage",
  version: 1,
  partialize: (state) => ({ columns: state.columns }),
}));
