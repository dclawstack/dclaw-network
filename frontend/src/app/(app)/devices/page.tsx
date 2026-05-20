"use client"

import { useEffect, useState } from "react"
import { api, Device, DeviceCreate, DeviceStatus, DeviceType } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

const statusColor: Record<DeviceStatus, string> = {
  online: "default",
  offline: "destructive",
  degraded: "secondary",
  unknown: "outline",
}

function AddDeviceForm({ onAdded }: { onAdded: () => void }) {
  const [form, setForm] = useState<DeviceCreate>({
    hostname: "", ip_address: "", device_type: "other", status: "unknown",
  })
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.createDevice(form)
      onAdded()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="hostname">Hostname *</Label>
        <Input
          id="hostname"
          value={form.hostname}
          onChange={(e) => setForm({ ...form, hostname: e.target.value })}
          required
          placeholder="router-01"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="ip">IP Address *</Label>
        <Input
          id="ip"
          value={form.ip_address}
          onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
          required
          placeholder="192.168.1.1"
          className="mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select
            value={form.device_type}
            onChange={(e) => setForm({ ...form, device_type: e.target.value as DeviceType })}
          >
            {["router", "switch", "firewall", "server", "ap", "other"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="vendor">Vendor</Label>
          <Input
            id="vendor"
            value={form.vendor ?? ""}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            placeholder="Cisco"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={form.location ?? ""}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="DC-1 Rack 3"
          className="mt-1"
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Adding…" : "Add Device"}
      </Button>
    </form>
  )
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "">("")
  const [dialogOpen, setDialogOpen] = useState(false)

  async function load() {
    const params: { q?: string; status?: DeviceStatus } = {}
    if (search) params.q = search
    if (statusFilter) params.status = statusFilter as DeviceStatus
    const data = await api.getDevices(params)
    setDevices(data)
  }

  useEffect(() => { load() }, [search, statusFilter])

  async function handleDelete(id: string) {
    if (!confirm("Delete this device? All related data will be removed.")) return
    await api.deleteDevice(id)
    load()
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Devices</h1>
        <Button onClick={() => setDialogOpen(true)}>+ Add Device</Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Add Device</DialogTitle>
            </DialogHeader>
            <AddDeviceForm onAdded={() => { setDialogOpen(false); load() }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Input
          placeholder="Search hostname or IP…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as DeviceStatus | "")}
        >
          <option value="">All statuses</option>
          {["online", "offline", "degraded", "unknown"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800">
                <TableHead>Hostname</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No devices found
                  </TableCell>
                </TableRow>
              ) : (
                devices.map((d) => (
                  <TableRow key={d.id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="font-medium text-white">
                      <a href={`/devices/${d.id}`} className="hover:text-amber-400 transition-colors">
                        {d.hostname}
                      </a>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{d.ip_address}</TableCell>
                    <TableCell className="capitalize">{d.device_type}</TableCell>
                    <TableCell>{d.vendor ?? "—"}</TableCell>
                    <TableCell>{d.location ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor[d.status] as "default" | "destructive" | "secondary" | "outline"}>
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(d.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-950"
                      >
                        Delete
                      </Button>
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
