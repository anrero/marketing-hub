"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "marketing-hub-onboarded"

const steps = [
  {
    emoji: "\u{1F680}",
    title: "Bienvenido a Marketing Hub",
    description:
      "Tu plataforma de gesti\u00f3n de marketing para equipos de dropshipping",
  },
  {
    emoji: "\u{1F4CB}",
    title: "Sidebar",
    description:
      "Navega entre boards, p\u00e1ginas y configuraci\u00f3n desde el panel lateral",
  },
  {
    emoji: "\u{1F4CC}",
    title: "Kanban",
    description:
      "Arrastra tareas entre columnas para cambiar su estado",
  },
  {
    emoji: "\u{1F4CA}",
    title: "Tabla",
    description:
      "Cambia a vista tabla para edici\u00f3n r\u00e1pida y filtros avanzados",
  },
  {
    emoji: "\u{2705}",
    title: "\u00a1Listo!",
    description:
      "Empieza a trabajar. Puedes repetir este tour desde Configuraci\u00f3n.",
  },
]

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY)
}

export function Onboarding() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const onboarded = localStorage.getItem(STORAGE_KEY)
    if (!onboarded) {
      setOpen(true)
    }
  }, [])

  function complete() {
    localStorage.setItem(STORAGE_KEY, "true")
    setOpen(false)
    setStep(0)
  }

  function handleNext() {
    if (step === steps.length - 1) {
      complete()
    } else {
      setStep((s) => s + 1)
    }
  }

  function handlePrev() {
    setStep((s) => Math.max(0, s - 1))
  }

  const current = steps[step]
  const isLastStep = step === steps.length - 1

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) complete() }}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="text-5xl mb-2">{current.emoji}</div>
          <DialogTitle>{current.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={step === 0}
          >
            Anterior
          </Button>

          <button
            type="button"
            onClick={complete}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Saltar
          </button>

          <Button size="sm" onClick={handleNext}>
            {isLastStep ? "Empezar" : "Siguiente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
