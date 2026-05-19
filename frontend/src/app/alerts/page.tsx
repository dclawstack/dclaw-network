"use client"

import { useEffect, useState } from "react"
import { api, Alert, AlertSeverity, AlertStatus } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Select } from "@/components/ui/select"

const severityColor: Record<AlertSeverity, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "">("")
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | "">("")

  async function load() {
    const params: { status?: AlertStatus; severity?: AlertSeverity } = {}
    if (statusFilter) params.status = statusFilter as AlertStatus
    if (severityFilter) params.severity = severityFilter as AlertSeverity
    const data = await api.getAlerts(params)
    setAlerts(data)
  }

  useEffect(() => { load() }, [statusFilter, severityFilter])

  async function handleAcknowledge(id: string) {
    await api.updateAlert(id, { status: "acknowledged" })
    load()
  }

  async function handleResolve(id: string) {
    await api.updateAlert(id, { status: "resolved" })
    load()
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this alert?")) return
    await api.deleteAlert(id)
    load()
  }

  const openCount = alerts.filter((a) => a.status === "open").length
  const criticalCount = alerts.filter((a) => a.severity === "critical" && a.status === "open").length

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alerts</h1>
          <p className="text-gray-400 text-sm mt-1">
            {openCount} open · {criticalCount} critical
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as AlertStatus | "")}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="resolved">Resolved</option>
        </Select>
        <Select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | "")}
        >
          <option value="">All severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </Select>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800">
                <TableHead>Severity</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No alerts found
                  </TableCell>
                </TableRow>
              ) : (
                alerts.map((alert) => (
                  <TableRow key={alert.id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell>
                      <Badge variant={severityColor[alert.severity]}>
                        {alert.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-white max-w-xs truncate">
                      {alert.title}
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm max-w-sm truncate">
                      {alert.description ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {alert.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(alert.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {alert.status === "open" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAcknowledge(alert.id)}
                            className="text-xs"
                          >
                            Ack
                          </Button>
                        )}
                        {alert.status !== "resolved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResolve(alert.id)}
                            className="text-xs"
                          >
                            Resolve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(alert.id)}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          ✕
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
