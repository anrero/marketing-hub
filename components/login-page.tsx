"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const { login, register } = useAuthStore();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Formato de email inválido"); return; }
    const result = login(email, password);
    if (!result.success) setError(result.error ?? "Error al iniciar sesión");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    if (!email.includes("@")) { setError("Formato de email inválido"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    const result = register(name.trim(), email, password);
    if (!result.success) setError(result.error ?? "Error al crear cuenta");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 px-4">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      <div className="relative w-full max-w-[400px] space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="text-5xl mb-3">🚀</div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing Hub</h1>
          <p className="text-sm text-muted-foreground">Gestión de marketing para equipos de dropshipping</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card shadow-xl p-6">
          {/* Tabs */}
          <div className="flex mb-6 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => { setTab("login"); setError(""); }}
              className={cn("flex-1 rounded-md py-2 text-sm font-medium transition-all", tab === "login" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className={cn("flex-1 rounded-md py-2 text-sm font-medium transition-all", tab === "register" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              Registrarse
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" className="h-10" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contraseña</label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" autoComplete="current-password" className="h-10 pr-10" required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded accent-primary h-3.5 w-3.5" />
                  <span className="text-xs text-muted-foreground">Recordarme</span>
                </label>
                <button type="button" className="text-xs text-primary hover:underline">¿Olvidaste tu contraseña?</button>
              </div>
              <Button type="submit" className="w-full h-10">Iniciar sesión</Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nombre completo</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" autoComplete="name" className="h-10" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" autoComplete="email" className="h-10" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Contraseña</label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" className="h-10 pr-10" required />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirmar contraseña</label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repetir contraseña" autoComplete="new-password" className="h-10" required />
              </div>
              <Button type="submit" className="w-full h-10">Crear cuenta</Button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
