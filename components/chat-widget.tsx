"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageCircle, X, Send, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useChatStore } from "@/stores/chat-store";
import { useAuthStore } from "@/stores/auth-store";
import { useBoardStore } from "@/stores/board-store";
import { cn } from "@/lib/utils";

function timeLabel(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const today = now.toDateString() === d.toDateString();
  if (today) return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === d.toDateString()) return "ayer";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function dateSeparator(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  if (now.toDateString() === d.toDateString()) return "Hoy";
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.toDateString() === d.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"general" | "board" | "direct">("general");
  const [directTarget, setDirectTarget] = useState<{ id: string; name: string; avatar: string; color?: string } | null>(null);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentUser = useAuthStore((s) => s.currentUser);
  const allChatMessages = useChatStore((s) => s.messages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const markAsRead = useChatStore((s) => s.markAsRead);
  const activeBoardId = useBoardStore((s) => s.activeBoardId);
  const boards = useBoardStore((s) => s.boards);
  const getAllTeamMembers = useBoardStore((s) => s.getAllTeamMembers);
  const activeBoard = boards.find((b) => b.id === activeBoardId);

  const allMembers = useMemo(() => getAllTeamMembers(), [getAllTeamMembers]);

  const userId = currentUser?.id ?? "";
  const userName = currentUser?.name ?? "Usuario";

  const totalUnread = useMemo(() => allChatMessages.filter((m) => !m.read && m.senderId !== userId).length, [allChatMessages, userId]);

  const channelId = tab === "general" ? "general" : tab === "board" ? activeBoardId : directTarget?.id ?? "";
  const messages = useMemo(() => {
    if (tab === "direct" && !directTarget) return [];
    let msgs: typeof allChatMessages;
    if (tab === "direct") {
      msgs = allChatMessages.filter((m) =>
        m.channelType === "direct" && (
          (m.senderId === userId && m.channelId === directTarget!.id) ||
          (m.senderId === directTarget!.id && m.channelId === userId)
        )
      );
    } else {
      msgs = allChatMessages.filter((m) => m.channelType === tab && m.channelId === channelId);
    }
    return msgs;
  }, [tab, channelId, directTarget, userId, allChatMessages]);

  // Load messages from server when chat opens or channel changes
  useEffect(() => {
    if (!open || !channelId) return;
    loadMessages(tab, channelId, userId);
  }, [open, tab, channelId, userId, loadMessages]);

  // Poll for new messages every 5 seconds while chat is open
  useEffect(() => {
    if (!open || !channelId) return;
    const interval = setInterval(() => {
      loadMessages(tab, channelId, userId);
    }, 5000);
    return () => clearInterval(interval);
  }, [open, tab, channelId, userId, loadMessages]);

  // Auto-scroll on new message
  const msgCount = messages.length;
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgCount, open]);

  // Mark as read when viewing
  useEffect(() => {
    if (open && channelId) markAsRead(tab, channelId, userId);
  }, [open, tab, channelId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const cid = tab === "direct" ? (directTarget?.id ?? "") : channelId;
    sendMessage(trimmed, tab, cid, userId, userName);
    setText("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const otherMembers = useMemo(() => allMembers.filter((m) => m.id !== userId), [allMembers, userId]);

  const dmUnreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of otherMembers) {
      counts[m.id] = allChatMessages.filter((msg) => msg.channelType === "direct" && msg.senderId === m.id && msg.channelId === userId && !msg.read).length;
    }
    return counts;
  }, [allChatMessages, otherMembers, userId]);

  if (!currentUser) return null;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all",
          open && "bg-muted text-foreground hover:bg-muted/80"
        )}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce">
            {totalUnread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[380px] max-w-[calc(100vw-40px)] h-[500px] max-h-[70vh] rounded-xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30 shrink-0">
            {tab === "direct" && directTarget ? (
              <>
                <button onClick={() => setDirectTarget(null)} className="rounded p-0.5 hover:bg-muted transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-semibold flex-1 truncate">{directTarget.name}</span>
              </>
            ) : (
              <span className="text-sm font-semibold flex-1">
                {tab === "general" ? "Chat General" : tab === "board" ? `Chat — ${activeBoard?.name ?? "Board"}` : "Mensajes Directos"}
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border shrink-0">
            {(["general", "board", "direct"] as const).map((t) => (
              <button key={t} onClick={() => { setTab(t); setDirectTarget(null); }}
                className={cn("flex-1 py-2 text-xs font-medium transition-colors relative", tab === t ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground")}>
                {t === "general" ? "General" : t === "board" ? "Board" : "Directo"}
              </button>
            ))}
          </div>

          {/* Content */}
          {tab === "direct" && !directTarget ? (
            /* Member list */
            <div className="flex-1 overflow-y-auto p-2">
              {otherMembers.map((m) => {
                const unread = dmUnreadCounts[m.id] ?? 0;
                return (
                  <button key={m.id} onClick={() => setDirectTarget({ id: m.id, name: m.name, avatar: m.avatar ?? m.name[0], color: m.color })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors text-left">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={cn("text-xs text-white", m.color ?? "bg-muted")}>{m.avatar ?? m.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.role}</p>
                    </div>
                    {unread > 0 && <span className="rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5">{unread}</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            /* Messages */
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {messages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-8">No hay mensajes aún. ¡Escribe el primero!</p>
                )}
                {messages.map((msg, i) => {
                  const isOwn = msg.senderId === userId;
                  const prevMsg = messages[i - 1];
                  const showAvatar = !prevMsg || prevMsg.senderId !== msg.senderId;
                  const showDate = !prevMsg || new Date(prevMsg.timestamp).toDateString() !== new Date(msg.timestamp).toDateString();
                  const member = allMembers.find((m) => m.id === msg.senderId);
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center gap-2 py-2">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[10px] text-muted-foreground">{dateSeparator(msg.timestamp)}</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <div className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                        {showAvatar && !isOwn ? (
                          <Avatar className="h-6 w-6 mt-1 shrink-0">
                            <AvatarFallback className={cn("text-[9px] text-white", member?.color ?? "bg-muted")}>{member?.avatar ?? msg.senderName[0]}</AvatarFallback>
                          </Avatar>
                        ) : !isOwn ? <div className="w-6 shrink-0" /> : null}
                        <div className={cn("max-w-[75%]", isOwn && "text-right")}>
                          {showAvatar && !isOwn && (
                            <p className="text-[10px] font-medium text-muted-foreground mb-0.5 px-1">{msg.senderName}</p>
                          )}
                          <div className={cn(
                            "inline-block rounded-xl px-3 py-1.5 text-xs leading-relaxed break-words text-left whitespace-pre-wrap",
                            isOwn ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                          )}>
                            {msg.text}
                          </div>
                          <p className={cn("text-[9px] text-muted-foreground/60 mt-0.5 px-1", isOwn && "text-right")}>{timeLabel(msg.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <div className="p-2 border-t border-border shrink-0">
                <div className="flex gap-1.5 items-end">
                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 resize-none text-xs bg-muted/50 rounded-lg px-3 py-2 outline-none border border-transparent focus:border-border min-h-[36px] max-h-[80px]"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    onInput={(e) => {
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = Math.min(el.scrollHeight, 80) + "px";
                    }}
                  />
                  <button onClick={handleSend} disabled={!text.trim()}
                    className="rounded-lg bg-primary text-primary-foreground p-2 hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
