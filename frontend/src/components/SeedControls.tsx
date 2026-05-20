// ─── SEED CONTROLS ────────────────────────────────────────────────────────────
// Demo utility — remove this file and the <SeedControls /> import in page.tsx
// when no longer needed.
// ──────────────────────────────────────────────────────────────────────────────
"use client"

import { useState } from "react"
import { api } from "@/lib/api"

type Status = "idle" | "loading" | "success" | "error"

export function SeedControls() {
  const [fillStatus, setFillStatus] = useState<Status>("idle")
  const [clearStatus, setClearStatus] = useState<Status>("idle")
  const [summary, setSummary] = useState<string | null>(null)

  async function handleFill() {
    setFillStatus("loading")
    setSummary(null)
    try {
      const res = await api.seedData()
      setSummary(
        `Seeded: ${res.devices} devices · ${res.interfaces} interfaces · ${res.metric_samples} metrics · ${res.alerts} alerts · ${res.configs} configs`
      )
      setFillStatus("success")
    } catch (e: any) {
      setSummary(e.message ?? "Seed failed")
      setFillStatus("error")
    }
  }

  async function handleClear() {
    setClearStatus("loading")
    setSummary(null)
    try {
      await api.clearData()
      setSummary("All data cleared. App is back to fresh state.")
      setClearStatus("success")
      setFillStatus("idle")
    } catch (e: any) {
      setSummary(e.message ?? "Clear failed")
      setClearStatus("error")
    }
  }

  const fillLabel = fillStatus === "loading" ? "Seeding…" : fillStatus === "success" ? "Seeded ✓" : "Fill Seed Data"
  const clearLabel = clearStatus === "loading" ? "Clearing…" : clearStatus === "success" ? "Cleared ✓" : "Clear Data"

  return (
    <div className="border border-dashed border-amber-500/40 rounded-xl p-6 bg-amber-500/5 text-center space-y-4">
      <div className="space-y-1">
        <p className="text-xs text-amber-500/70 font-mono uppercase tracking-widest">Demo Controls</p>
        <p className="text-sm text-gray-400">
          Populate the app with realistic network data, or wipe it to start fresh.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={handleFill}
          disabled={fillStatus === "loading" || clearStatus === "loading"}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 text-gray-950 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {fillLabel}
        </button>
        <button
          onClick={handleClear}
          disabled={fillStatus === "loading" || clearStatus === "loading"}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {clearLabel}
        </button>
      </div>

      {summary && (
        <p className={`text-xs font-mono ${fillStatus === "error" || clearStatus === "error" ? "text-red-400" : "text-emerald-400"}`}>
          {summary}
        </p>
      )}
    </div>
  )
}
