"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBoardStore } from "@/stores/board-store";
import { TEAM_MEMBERS } from "@/lib/mock-data";
import { Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/types";

// ── Inline editable text ────────────────────────────────────
function InlineEdit({
  value,
  onSave,
  className,
}: {
  value: string;
  onSave: (val: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    }
  }, [editing, value]);

  const save = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) {
      onSave(draft.trim());
    }
  };

  if (editing) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") setEditing(false);
        }}
        className={cn("h-6 text-xs px-1.5 py-0", className)}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        "cursor-pointer rounded px-1 py-0.5 hover:bg-accent transition-colors",
        className
      )}
    >
      {value}
    </span>
  );
}

// ── Editable list section (stores, ad accounts, campaign types) ─
function EditableListSection({
  title,
  items,
  defaultItems,
  onAdd,
  onRemove,
  placeholder,
}: {
  title: string;
  items: string[];
  defaultItems: readonly string[] | string[];
  onAdd: (item: string) => void;
  onRemove: (item: string) => void;
  placeholder: string;
}) {
  const [adding, setAdding] = useState(false);
  const [newVal, setNewVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adding) setTimeout(() => inputRef.current?.focus(), 0);
  }, [adding]);

  const handleAdd = () => {
    if (newVal.trim() && !items.includes(newVal.trim())) {
      onAdd(newVal.trim());
      setNewVal("");
      setAdding(false);
    }
  };

  const allItems = items;
  const isDefault = (item: string) =>
    (defaultItems as string[]).includes(item);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-primary"
          onClick={() => setAdding(true)}
        >
          <Plus className="h-3 w-3" />
          Agregar
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {allItems.map((item) => (
          <span
            key={item}
            className="group flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs font-medium transition-colors"
          >
            {item}
            {!isDefault(item) && (
              <button
                onClick={() => onRemove(item)}
                className="ml-0.5 rounded-full p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}
      </div>

      {adding && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            ref={inputRef}
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            placeholder={placeholder}
            className="h-8 flex-1 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setNewVal("");
                setAdding(false);
              }
            }}
          />
          <Button size="sm" className="h-8 px-3" onClick={handleAdd}>
            <Check className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            onClick={() => {
              setNewVal("");
              setAdding(false);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </section>
  );
}

// ── Avatar color options ────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-indigo-500",
];

// ── Main settings dialog ────────────────────────────────────
export function SettingsDialog() {
  const {
    settingsOpen,
    setSettingsOpen,
    getAllStores,
    getAllCampaignTypes,
    getAllAdAccounts,
    getAllTeamMembers,
    addCustomStore,
    removeCustomStore,
    addCustomCampaignType,
    removeCustomCampaignType,
    addCustomAdAccount,
    removeCustomAdAccount,
    addTeamMember,
    removeTeamMember,
    updateTeamMember,
  } = useBoardStore();

  const allStores = getAllStores();
  const allCampaignTypes = getAllCampaignTypes();
  const allAdAccounts = getAllAdAccounts();
  const allTeamMembers = getAllTeamMembers();

  // New member form state
  const [addingMember, setAddingMember] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newColor, setNewColor] = useState(AVATAR_COLORS[0]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingMember) setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [addingMember]);

  const handleAddMember = () => {
    if (!newName.trim()) return;
    const initials = newName
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const member: TeamMember = {
      id: `u${Date.now()}`,
      name: newName.trim(),
      avatar: initials,
      role: newRole.trim() || "Miembro",
      color: newColor,
    };
    addTeamMember(member);
    setNewName("");
    setNewRole("");
    setNewColor(AVATAR_COLORS[0]);
    setAddingMember(false);
  };

  const isDefaultMember = (id: string) =>
    TEAM_MEMBERS.some((m) => m.id === id);

  return (
    <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-6 py-2">
            {/* ── Equipo ────────────────────────────────── */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">Equipo</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-primary"
                  onClick={() => setAddingMember(true)}
                >
                  <Plus className="h-3 w-3" />
                  Agregar miembro
                </Button>
              </div>

              <div className="space-y-2">
                {allTeamMembers.map((m) => (
                  <div
                    key={m.id}
                    className="group flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={cn(
                          "text-xs font-medium text-white",
                          m.color || "bg-muted"
                        )}
                      >
                        {m.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      {isDefaultMember(m.id) ? (
                        <>
                          <p className="text-sm font-medium">{m.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {m.role}
                          </p>
                        </>
                      ) : (
                        <>
                          <InlineEdit
                            value={m.name}
                            onSave={(val) =>
                              updateTeamMember(m.id, {
                                name: val,
                                avatar: val
                                  .split(" ")
                                  .map((w) => w[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2),
                              })
                            }
                            className="text-sm font-medium"
                          />
                          <InlineEdit
                            value={m.role}
                            onSave={(val) =>
                              updateTeamMember(m.id, { role: val })
                            }
                            className="text-xs text-muted-foreground"
                          />
                        </>
                      )}
                    </div>
                    {!isDefaultMember(m.id) && (
                      <button
                        onClick={() => removeTeamMember(m.id)}
                        className="rounded-full p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add member form */}
              {addingMember && (
                <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                  <Input
                    ref={nameInputRef}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Nombre del miembro"
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddMember();
                      if (e.key === "Escape") setAddingMember(false);
                    }}
                  />
                  <Input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Rol / Cargo"
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddMember();
                      if (e.key === "Escape") setAddingMember(false);
                    }}
                  />
                  <div>
                    <p className="mb-1.5 text-xs text-muted-foreground">
                      Color de avatar
                    </p>
                    <div className="flex gap-1.5">
                      {AVATAR_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewColor(color)}
                          className={cn(
                            "h-6 w-6 rounded-full transition-all",
                            color,
                            newColor === color
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                              : "opacity-60 hover:opacity-100"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleAddMember}
                      disabled={!newName.trim()}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Agregar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setAddingMember(false);
                        setNewName("");
                        setNewRole("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </section>

            <Separator />

            {/* ── Tiendas ───────────────────────────────── */}
            <EditableListSection
              title="Tiendas"
              items={allStores}
              defaultItems={[
                "MedSock",
                "Tendearte",
                "FloraCare",
                "WildropShop",
                "Rojucol",
                "Monklic",
              ]}
              onAdd={addCustomStore}
              onRemove={removeCustomStore}
              placeholder="Nombre de tienda..."
            />

            <Separator />

            {/* ── Cuentas Publicitarias ──────────────────── */}
            <EditableListSection
              title="Cuentas Publicitarias"
              items={allAdAccounts}
              defaultItems={[
                "Act_MedSock_001",
                "Act_Tendearte_001",
                "Act_FloraCare_001",
                "Act_WildropShop_001",
                "Act_Rojucol_001",
                "Act_Monklic_001",
              ]}
              onAdd={addCustomAdAccount}
              onRemove={removeCustomAdAccount}
              placeholder="Nombre de cuenta publicitaria..."
            />

            <Separator />

            {/* ── Tipos de Campaña ──────────────────────── */}
            <EditableListSection
              title="Tipos de Campaña"
              items={allCampaignTypes}
              defaultItems={[
                "Conversión",
                "Tráfico",
                "Remarketing",
                "Lookalike",
                "TOF",
                "BOF",
              ]}
              onAdd={addCustomCampaignType}
              onRemove={removeCustomCampaignType}
              placeholder="Nombre del tipo..."
            />

            <Separator />

            {/* ── Info ──────────────────────────────────── */}
            <section>
              <h4 className="mb-2 text-sm font-semibold">Acerca de</h4>
              <p className="text-xs text-muted-foreground">
                Marketing Hub v0.1.0 — Plataforma de gestión de marketing para
                equipos de dropshipping.
              </p>
            </section>

            <Separator />

            {/* ── Reset ─────────────────────────────────── */}
            <section>
              <h4 className="mb-2 text-sm font-semibold text-red-500">Zona peligrosa</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Esto eliminará todos los datos guardados y restaurará los datos de demostración.
              </p>
              <Button variant="outline" size="sm" className="text-xs text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => {
                if (confirm("¿Estás seguro? Se perderán todos los datos guardados.")) {
                  localStorage.removeItem("mh-board-storage");
                  localStorage.removeItem("mh-sidebar-storage");
                  localStorage.removeItem("mh-table-columns-storage");
                  window.location.reload();
                }
              }}>
                Resetear datos a demo
              </Button>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
