"use client"

import { useEffect, useState } from "react"
import { api, Device, NetworkConfig } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"

function diffLines(a: string, b: string) {
  const aLines = a.split("\n")
  const bLines = b.split("\n")
  const maxLen = Math.max(aLines.length, bLines.length)
  return Array.from({ length: maxLen }, (_, i) => ({
    a: aLines[i] ?? null,
    b: bLines[i] ?? null,
    changed: aLines[i] !== bLines[i],
  }))
}

function ConfigDiff({ a, b }: { a: NetworkConfig; b: NetworkConfig }) {
  const lines = diffLines(a.config_text, b.config_text)
  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {["Before", "After"].map((label, col) => (
        <div key={label}>
          <div className="text-xs text-gray-400 mb-1 font-medium">{label}</div>
          <pre className="bg-gray-950 rounded p-3 text-xs font-mono overflow-x-auto max-h-96 overflow-y-auto">
            {lines.map((line, i) => {
              const text = col === 0 ? line.a : line.b
              const cls = line.changed
                ? col === 0 ? "bg-red-950/40 text-red-300" : "bg-emerald-950/40 text-emerald-300"
                : "text-gray-400"
              return (
                <div key={i} className={`${cls} px-1 rounded`}>
                  {text ?? ""}
                </div>
              )
            })}
          </pre>
        </div>
      ))}
    </div>
  )
}

export default function ConfigsPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [configs, setConfigs] = useState<NetworkConfig[]>([])
  const [diffA, setDiffA] = useState<string>("")
  const [diffB, setDiffB] = useState<string>("")
  const [tab, setTab] = useState("history")

  useEffect(() => { api.getDevices().then(setDevices) }, [])

  useEffect(() => {
    if (!selectedDeviceId) { setConfigs([]); return }
    api.getConfigs(selectedDeviceId).then(setConfigs)
  }, [selectedDeviceId])

  const configA = configs.find((c) => c.id === diffA)
  const configB = configs.find((c) => c.id === diffB)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurations</h1>
        <p className="text-gray-400 text-sm mt-1">Config snapshots and compliance</p>
      </div>

      <div className="flex gap-3">
        <Select
          value={selectedDeviceId}
          onChange={(e) => setSelectedDeviceId(e.target.value)}
        >
          <option value="">Select a device…</option>
          {devices.map((d) => (
            <option key={d.id} value={d.id}>{d.hostname} ({d.ip_address})</option>
          ))}
        </Select>
      </div>

      {selectedDeviceId && (
        <div>
          {/* Tab switcher */}
          <div className="inline-flex bg-gray-800 rounded-md p-1 gap-1 mb-4">
            {["history", "diff"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm rounded capitalize transition-colors ${
                  tab === t ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "history" && (
            <div className="space-y-3">
              {configs.length === 0 ? (
                <p className="text-gray-500">No configs captured for this device.</p>
              ) : (
                configs.map((cfg) => (
                  <Card key={cfg.id} className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm text-gray-200">
                          {new Date(cfg.captured_at).toLocaleString()}
                        </CardTitle>
                        <span className="font-mono text-xs text-gray-500">
                          {cfg.config_hash.slice(0, 8)}…
                        </span>
                      </div>
                      {cfg.notes && <p className="text-xs text-gray-400">{cfg.notes}</p>}
                    </CardHeader>
                    {cfg.compliance_notes && (
                      <CardContent>
                        <div className="text-xs text-amber-400 bg-amber-950/30 rounded p-2">
                          <span className="font-medium">AI Compliance: </span>
                          {cfg.compliance_notes}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {tab === "diff" && (
            <div>
              {configs.length < 2 ? (
                <p className="text-gray-500">Need at least 2 snapshots to compare.</p>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400">Snapshot A (before)</label>
                      <Select value={diffA} onChange={(e) => setDiffA(e.target.value)}>
                        <option value="">Select snapshot…</option>
                        {configs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {new Date(c.captured_at).toLocaleString()} · {c.config_hash.slice(0, 8)}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400">Snapshot B (after)</label>
                      <Select value={diffB} onChange={(e) => setDiffB(e.target.value)}>
                        <option value="">Select snapshot…</option>
                        {configs.map((c) => (
                          <option key={c.id} value={c.id}>
                            {new Date(c.captured_at).toLocaleString()} · {c.config_hash.slice(0, 8)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  {configA && configB && <ConfigDiff a={configA} b={configB} />}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
