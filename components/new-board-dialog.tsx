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
import { useBoardStore } from "@/stores/board-store";
import { toast } from "sonner";

export function NewBoardDialog() {
  const { newBoardDialogOpen, setNewBoardDialogOpen, addBoard } =
    useBoardStore();
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) return;
    addBoard(name.trim());
    setName("");
    setNewBoardDialogOpen(false);
    toast.success("Board creado");
  };

  return (
    <Dialog open={newBoardDialogOpen} onOpenChange={setNewBoardDialogOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Nuevo Board</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Nombre del board
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Campañas Instagram..."
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setNewBoardDialogOpen(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Crear board
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
