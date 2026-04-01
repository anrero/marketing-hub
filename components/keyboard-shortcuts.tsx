"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useBoardStore } from "@/stores/board-store"
import { useSidebarStore } from "@/stores/sidebar-store"

const kbdClass = "rounded border bg-muted px-1.5 py-0.5 text-[10px] font-mono"

interface ShortcutEntry {
  keys: string
  description: string
}

interface ShortcutSection {
  title: string
  shortcuts: ShortcutEntry[]
}

const sections: ShortcutSection[] = [
  {
    title: "General",
    shortcuts: [
      { keys: "Ctrl+K", description: "Buscar" },
      { keys: "?", description: "Atajos" },
      { keys: "Ctrl+N", description: "Nueva tarea" },
    ],
  },
  {
    title: "Navegación",
    shortcuts: [
      { keys: "Ctrl+1", description: "Dashboard" },
      { keys: "Ctrl+2", description: "Primer board" },
      { keys: "Ctrl+[", description: "Colapsar sidebar" },
      { keys: "Ctrl+]", description: "Expandir sidebar" },
    ],
  },
  {
    title: "Editor de texto",
    shortcuts: [
      { keys: "Ctrl+B", description: "Negrita" },
      { keys: "Ctrl+I", description: "Cursiva" },
      { keys: "Ctrl+U", description: "Subrayado" },
      { keys: "/", description: "Slash commands" },
      { keys: "---", description: "Divisor" },
      { keys: "#", description: "Encabezado" },
    ],
  },
  {
    title: "Tabla",
    shortcuts: [
      { keys: "Tab", description: "Siguiente celda" },
      { keys: "Enter", description: "Editar/Confirmar" },
      { keys: "Escape", description: "Cancelar" },
    ],
  },
]

// Global setter for external access
let globalSetShortcutsOpen: ((open: boolean) => void) | null = null;
export function openShortcutsModal() { globalSetShortcutsOpen?.(true); }

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)
  useEffect(() => { globalSetShortcutsOpen = setOpen; return () => { globalSetShortcutsOpen = null; }; }, [])
  const setNewTaskDialogOpen = useBoardStore((s) => s.setNewTaskDialogOpen)
  const boards = useBoardStore((s) => s.boards)
  const setActiveBoard = useBoardStore((s) => s.setActiveBoard)
  const setMainView = useSidebarStore((s) => s.setMainView)
  const collapsed = useSidebarStore((s) => s.collapsed)
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const tag = target.tagName
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable

      // "?" key — multiple detection methods for different keyboard layouts
      if ((e.key === "?" || e.key === "¿" || (e.shiftKey && e.code === "Slash")) && !isInput && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        e.stopPropagation()
        setOpen((prev) => !prev)
        return
      }

      // Ctrl-based shortcuts (work everywhere)
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "n":
            e.preventDefault()
            setNewTaskDialogOpen(true)
            break
          case "1":
            e.preventDefault()
            setMainView("dashboard")
            break
          case "2":
            e.preventDefault()
            if (boards.length > 0) {
              setActiveBoard(boards[0].id)
              setMainView("board")
            }
            break
          case "[":
            e.preventDefault()
            if (!collapsed) toggleCollapsed()
            break
          case "]":
            e.preventDefault()
            if (collapsed) toggleCollapsed()
            break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [collapsed, boards, setNewTaskDialogOpen, setMainView, setActiveBoard, toggleCollapsed])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Atajos de teclado</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
                {section.title}
              </h3>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                {section.shortcuts.map((shortcut) => (
                  <div key={shortcut.keys} className="contents">
                    <div className="flex items-center gap-1">
                      {shortcut.keys.split("+").map((key, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-muted-foreground text-[10px] mx-0.5">+</span>}
                          <kbd className={kbdClass}>{key}</kbd>
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {shortcut.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
