"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { api, Device, NetworkInterface, Alert, NetworkConfig, MetricSample, MetricType } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

const statusColor: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  online: "default", offline: "destructive", degraded: "secondary", unknown: "outline",
  up: "default", down: "destructive",
  open: "destructive", acknowledged: "secondary", resolved: "outline",
}
const severityColor: Record<string, "destructive" | "secondary" | "outline"> = {
  critical: "destructive", warning: "secondary", info: "outline",
}

function SparkBar({ samples, label, unit }: { samples: MetricSample[]; label: string; unit: string }) {
  if (samples.length === 0) return (
    <div className="text-xs text-gray-500">No {label} data</div>
  )
  const values = samples.map((s) => s.value)
  const max = Math.max(...values, 1)
  const latest = values[0]
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const bars = values.slice(0, 30).reverse()

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-gray-300">
          latest: <span className="font-medium text-white">{latest.toFixed(1)}{unit}</span>
          {" "}· avg: {avg.toFixed(1)}{unit}
        </span>
      </div>
      <div className="flex items-end gap-0.5 h-8">
        {bars.map((v, i) => {
          const pct = (v / max) * 100
          const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-yellow-500" : "bg-emerald-500"
          return (
            <div
              key={i}
              className={`flex-1 ${color} rounded-sm min-w-[2px]`}
              style={{ height: `${Math.max(pct, 4)}%` }}
              title={`${v.toFixed(2)}${unit}`}
            />
          )
        })}
      </div>
    </div>
  )
}

const METRIC_CONFIG: { type: MetricType; label: string; unit: string }[] = [
  { type: "latency_ms", label: "Latency", unit: " ms" },
  { type: "packet_loss_pct", label: "Packet Loss", unit: "%" },
  { type: "cpu_pct", label: "CPU", unit: "%" },
  { type: "memory_pct", label: "Memory", unit: "%" },
]

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [device, setDevice] = useState<Device | null>(null)
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [configs, setConfigs] = useState<NetworkConfig[]>([])
  const [metrics, setMetrics] = useState<Record<MetricType, MetricSample[]>>({} as any)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      api.getDevice(id),
      api.getInterfaces(id),
      api.getAlerts({ device_id: id }),
      api.getConfigs(id),
      ...METRIC_CONFIG.map((m) => api.getMetrics({ device_id: id, metric_type: m.type, limit: 30 })),
    ]).then(([dev, ifaces, alts, cfgs, ...metricArrays]) => {
      setDevice(dev as Device)
      setInterfaces(ifaces as NetworkInterface[])
      setAlerts(alts as Alert[])
      setConfigs(cfgs as NetworkConfig[])
      const m: any = {}
      METRIC_CONFIG.forEach((mc, i) => { m[mc.type] = metricArrays[i] })
      setMetrics(m)
    }).finally(() => setLoading(false))
  }, [id])

  async function handleAcknowledge(alertId: string) {
    await api.updateAlert(alertId, { status: "acknowledged" })
    const updated = await api.getAlerts({ device_id: id })
    setAlerts(updated)
  }

  async function handleResolve(alertId: string) {
    await api.updateAlert(alertId, { status: "resolved" })
    const updated = await api.getAlerts({ device_id: id })
    setAlerts(updated)
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!device) return <div className="p-8 text-red-400">Device not found.</div>

  const openAlerts = alerts.filter((a) => a.status === "open")

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/devices" className="text-sm text-gray-500 hover:text-gray-300 mb-1 block">
            ← Devices
          </Link>
          <h1 className="text-2xl font-bold text-white">{device.hostname}</h1>
          <p className="text-gray-400 font-mono text-sm mt-0.5">{device.ip_address}</p>
        </div>
        <Badge variant={statusColor[device.status]} className="text-sm px-3 py-1">
          {device.status}
        </Badge>
      </div>

      {/* Device info */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ["Type", device.device_type],
          ["Vendor", device.vendor ?? "—"],
          ["Model", device.model ?? "—"],
          ["Location", device.location ?? "—"],
        ].map(([label, value]) => (
          <Card key={label} className="bg-gray-900 border-gray-800">
            <CardContent className="py-3">
              <div className="text-xs text-gray-500">{label}</div>
              <div className="text-sm text-white font-medium capitalize mt-0.5">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Metric sparklines */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader><CardTitle className="text-base text-gray-200">Metrics (last 30 samples)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          {METRIC_CONFIG.map((mc) => (
            <SparkBar
              key={mc.type}
              samples={metrics[mc.type] ?? []}
              label={mc.label}
              unit={mc.unit}
            />
          ))}
        </CardContent>
      </Card>

      {/* Interfaces */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Interfaces <span className="text-gray-500 text-sm font-normal">({interfaces.length})</span>
        </h2>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800">
                  <TableHead>Name</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>MAC</TableHead>
                  <TableHead>Speed</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interfaces.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-gray-500 py-6">No interfaces</TableCell></TableRow>
                ) : interfaces.map((iface) => (
                  <TableRow key={iface.id} className="border-gray-800">
                    <TableCell className="font-mono text-sm">{iface.name}</TableCell>
                    <TableCell className="font-mono text-sm">{iface.ip_address ?? "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-gray-400">{iface.mac_address ?? "—"}</TableCell>
                    <TableCell>{iface.speed_mbps ? `${iface.speed_mbps} Mbps` : "—"}</TableCell>
                    <TableCell><Badge variant={statusColor[iface.status] ?? "outline"}>{iface.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Active alerts */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Open Alerts <span className="text-gray-500 text-sm font-normal">({openAlerts.length})</span>
        </h2>
        {openAlerts.length === 0 ? (
          <p className="text-gray-500 text-sm">No open alerts for this device.</p>
        ) : (
          <div className="space-y-2">
            {openAlerts.map((alert) => (
              <Card key={alert.id} className="bg-gray-900 border-gray-800">
                <CardContent className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant={severityColor[alert.severity]}>{alert.severity}</Badge>
                    <div>
                      <div className="text-sm font-medium text-white">{alert.title}</div>
                      {alert.description && <div className="text-xs text-gray-400 mt-0.5">{alert.description}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => handleAcknowledge(alert.id)}>Ack</Button>
                    <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>Resolve</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Config history */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">
          Config History <span className="text-gray-500 text-sm font-normal">({configs.length})</span>
        </h2>
        {configs.length === 0 ? (
          <p className="text-gray-500 text-sm">No configuration snapshots captured.</p>
        ) : (
          <div className="space-y-2">
            {configs.slice(0, 5).map((cfg) => (
              <Card key={cfg.id} className="bg-gray-900 border-gray-800">
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white">{new Date(cfg.captured_at).toLocaleString()}</div>
                    {cfg.notes && <div className="text-xs text-gray-400">{cfg.notes}</div>}
                  </div>
                  <span className="font-mono text-xs text-gray-500">{cfg.config_hash.slice(0, 8)}…</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
