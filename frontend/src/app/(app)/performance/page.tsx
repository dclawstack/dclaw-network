"use client"

import { useEffect, useState } from "react"
import { api, Device, MetricSample, MetricType } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"

const METRIC_LABELS: Record<MetricType, string> = {
  latency_ms: "Latency (ms)",
  packet_loss_pct: "Packet Loss (%)",
  throughput_mbps: "Throughput (Mbps)",
  cpu_pct: "CPU (%)",
  memory_pct: "Memory (%)",
}

const RANGES = [
  { label: "1h", minutes: 60 },
  { label: "6h", minutes: 360 },
  { label: "24h", minutes: 1440 },
  { label: "7d", minutes: 10080 },
]

interface DeviceMetrics {
  device: Device
  samples: MetricSample[]
  avg: number | null
  max: number | null
}

function MetricBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-emerald-500"
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-32 truncate">{label}</span>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-300 w-16 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

export default function PerformancePage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [metrics, setMetrics] = useState<DeviceMetrics[]>([])
  const [metricType, setMetricType] = useState<MetricType>("latency_ms")
  const [rangeMinutes, setRangeMinutes] = useState(60)
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.getDevices().then(setDevices) }, [])

  useEffect(() => {
    if (devices.length === 0) return
    setLoading(true)
    const since = new Date(Date.now() - rangeMinutes * 60 * 1000).toISOString()
    Promise.all(
      devices.map(async (d) => {
        const samples = await api.getMetrics({
          device_id: d.id,
          metric_type: metricType,
          limit: 500,
        })
        const recent = samples.filter((s) => s.sampled_at >= since)
        const values = recent.map((s) => s.value)
        return {
          device: d,
          samples: recent,
          avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null,
          max: values.length ? Math.max(...values) : null,
        }
      })
    )
      .then((results) => {
        setMetrics(results.sort((a, b) => (b.avg ?? 0) - (a.avg ?? 0)))
      })
      .finally(() => setLoading(false))
  }, [devices, metricType, rangeMinutes])

  const globalMax = Math.max(...metrics.map((m) => m.max ?? 0), 1)

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Performance</h1>
        <p className="text-gray-400 text-sm mt-1">Metric trends across all devices</p>
      </div>

      <div className="flex gap-3 items-center">
        <Select
          value={metricType}
          onChange={(e) => setMetricType(e.target.value as MetricType)}
        >
          {(Object.keys(METRIC_LABELS) as MetricType[]).map((t) => (
            <option key={t} value={t}>{METRIC_LABELS[t]}</option>
          ))}
        </Select>
        <div className="inline-flex bg-gray-800 rounded-md p-1 gap-1">
          {RANGES.map((r) => (
            <button
              key={r.minutes}
              onClick={() => setRangeMinutes(r.minutes)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                rangeMinutes === r.minutes
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading metrics…</p>
      ) : (
        <div className="grid gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-base text-gray-200">
                Top Performers — {METRIC_LABELS[metricType]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {metrics.length === 0 ? (
                <p className="text-gray-500 text-sm">No data in this range. Ingest some metrics first.</p>
              ) : (
                metrics.map((m) => (
                  <MetricBar
                    key={m.device.id}
                    value={m.avg ?? 0}
                    max={globalMax}
                    label={m.device.hostname}
                  />
                ))
              )}
            </CardContent>
          </Card>

          {metrics.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-base text-gray-200">Summary Table</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-4 text-xs text-gray-500 pb-2 border-b border-gray-800">
                  <span>Device</span><span>Avg</span><span>Max</span><span>Samples</span>
                </div>
                {metrics.map((m) => (
                  <div key={m.device.id} className="grid grid-cols-4 text-sm">
                    <a href={`/devices/${m.device.id}`} className="text-amber-400 hover:underline truncate">
                      {m.device.hostname}
                    </a>
                    <span>{m.avg != null ? m.avg.toFixed(2) : "—"}</span>
                    <span>{m.max != null ? m.max.toFixed(2) : "—"}</span>
                    <span className="text-gray-500">{m.samples.length}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
