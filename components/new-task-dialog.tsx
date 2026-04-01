"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBoardStore } from "@/stores/board-store";
import { COLUMNS, PRIORITIES } from "@/lib/mock-data";
import type { Task, Status, Store, Priority } from "@/types";
import { toast } from "sonner";

export function NewTaskDialog() {
  const { newTaskDialogOpen, setNewTaskDialogOpen, addTask, getAllStores, getAllTeamMembers, taskTemplates, addTaskFromTemplate } = useBoardStore();
  const allStores = getAllStores();
  const allMembers = getAllTeamMembers();
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<Status>("por_hacer");
  const [priority, setPriority] = useState<Priority>("media");
  const [store, setStore] = useState<Store>("MedSock");
  const [assigneeId, setAssigneeId] = useState("u1");

  const handleCreate = () => {
    if (!title.trim()) return;
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: title.trim(),
      status,
      priority,
      store,
      assigneeId,
      campaignType: "Conversión",
      campaignName: "",
      adAccount: "",
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      urls: [],
      attachments: [],
      comments: [],
      activity: [
        {
          id: `a${Date.now()}`,
          authorId: assigneeId,
          action: "creó la tarea",
          createdAt: new Date().toISOString(),
        },
      ],
    };
    addTask(newTask);
    setTitle("");
    setStatus("por_hacer");
    setPriority("media");
    setStore("MedSock");
    setAssigneeId("u1");
    setNewTaskDialogOpen(false);
    toast.success("Tarea creada");
  };

  return (
    <Dialog open={newTaskDialogOpen} onOpenChange={setNewTaskDialogOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Templates */}
          {taskTemplates.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Crear desde plantilla</label>
              <div className="flex flex-wrap gap-1.5">
                {taskTemplates.map((tmpl) => (
                  <button key={tmpl.id} onClick={() => { addTaskFromTemplate(tmpl.id); setNewTaskDialogOpen(false); }} className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent/50 transition-colors">
                    {tmpl.name}
                  </button>
                ))}
              </div>
              <div className="relative py-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center"><span className="bg-popover px-2 text-[10px] text-muted-foreground">o crear manual</span></div></div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Título *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre de la tarea..."
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Columna
              </label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as Status)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Prioridad
              </label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tienda
              </label>
              <Select
                value={store}
                onValueChange={(v) => setStore(v as Store)}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allStores.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Responsable
              </label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setNewTaskDialogOpen(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim()}>
            Crear tarea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
