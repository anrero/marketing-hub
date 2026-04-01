"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji = "📭", title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-view-in">
      <span className="text-5xl mb-4">{emoji}</span>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground max-w-[250px] mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onAction}>
          <Plus className="h-3.5 w-3.5" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// Skeleton loaders
export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 p-6 overflow-hidden">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="w-[310px] min-w-[310px] rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          {[0, 1, 2].map((j) => (
            <div key={j} className="rounded-lg border border-border p-3 space-y-2">
              <div className="h-3 w-full rounded bg-muted animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
              <div className="flex gap-1.5">
                <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="p-6 space-y-2">
      <div className="h-8 w-full rounded bg-muted animate-pulse" />
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-10 w-full rounded bg-muted/50 animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />
      ))}
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-8 py-6 space-y-4">
      <div className="h-3 w-48 rounded bg-muted animate-pulse" />
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
        <div className="h-8 w-64 rounded bg-muted animate-pulse" />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-4 rounded bg-muted/50 animate-pulse" style={{ width: `${70 + Math.random() * 30}%`, animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  );
}
