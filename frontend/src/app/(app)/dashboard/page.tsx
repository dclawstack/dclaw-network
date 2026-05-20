"use client"

import { useEffect, useState } from "react"
import { api, DashboardStats, Alert } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const severityColor: Record<string, string> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-white">{value}</div>
        {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getDashboard()
      .then(setStats)
      .catch((e) => setError(e.message))

    api.getAlerts({ status: "open" })
      .then((a) => setAlerts(a.slice(0, 10)))
      .catch(() => {})
  }, [])

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-400">Could not reach API: {error}</p>
        <p className="text-gray-500 text-sm mt-1">Make sure the backend is running on port 8044.</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Network overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Devices" value={stats?.total_devices ?? "—"} />
        <StatCard
          label="Online"
          value={stats?.online_count ?? "—"}
          sub={stats ? `${stats.offline_count} offline · ${stats.degraded_count} degraded` : undefined}
        />
        <StatCard
          label="Open Alerts"
          value={stats?.open_alerts ?? "—"}
          sub={stats ? `${stats.critical_alerts} critical` : undefined}
        />
        <StatCard
          label="Avg Latency"
          value={stats?.avg_latency_ms != null ? `${stats.avg_latency_ms.toFixed(1)} ms` : "—"}
          sub="last hour"
        />
      </div>

      {/* Recent open alerts */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Recent Open Alerts</h2>
        {alerts.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-6 text-center text-gray-500">No open alerts</CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => (
              <Card key={alert.id} className="bg-gray-900 border-gray-800">
                <CardContent className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant={severityColor[alert.severity] as "destructive" | "secondary" | "outline"}>
                      {alert.severity}
                    </Badge>
                    <span className="text-sm text-white">{alert.title}</span>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    {new Date(alert.created_at).toLocaleString()}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
