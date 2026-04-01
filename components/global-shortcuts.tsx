"use client";

import { useEffect } from "react";
import { useBoardStore } from "@/stores/board-store";
import { toast } from "sonner";
import { openShortcutsModal } from "@/components/keyboard-shortcuts";

export function GlobalShortcuts() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      const tag = el.tagName;
      const editing = tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;

      // Undo — Ctrl+Z (not Shift), only when not editing text
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && !editing) {
        e.preventDefault();
        const s = useBoardStore.getState();
        if (s.undoStack.length > 0) {
          s.undo();
          toast.success("Acción deshecha");
        }
        return;
      }

      // Redo — Ctrl+Shift+Z or Ctrl+Y, only when not editing text
      if ((e.ctrlKey || e.metaKey) && !editing) {
        if ((e.shiftKey && (e.key === "z" || e.key === "Z")) || e.key === "y") {
          e.preventDefault();
          const s = useBoardStore.getState();
          if (s.redoStack.length > 0) {
            s.redo();
            toast.success("Acción rehecha");
          }
          return;
        }
      }

      // Shortcuts modal — ? key (multiple keyboard layouts)
      if ((e.key === "?" || e.key === "¿" || (e.shiftKey && e.code === "Slash")) && !e.ctrlKey && !e.metaKey && !editing) {
        e.preventDefault();
        openShortcutsModal();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return null;
}
