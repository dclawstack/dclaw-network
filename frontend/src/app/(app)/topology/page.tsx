"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { api, Device, NetworkInterface } from "@/lib/api"

// ── Layout constants ──────────────────────────────────────────────────────────

const NODE_R = 28
const SVG_W = 900
const SVG_H = 560

// ── Types ─────────────────────────────────────────────────────────────────────

interface Node {
  id: string
  label: string
  status: Device["status"]
  x: number
  y: number
}

interface Edge {
  from: string
  to: string
  subnet: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(status: Device["status"]) {
  switch (status) {
    case "online":   return { fill: "#22c55e", stroke: "#16a34a" }
    case "degraded": return { fill: "#f59e0b", stroke: "#d97706" }
    case "offline":  return { fill: "#ef4444", stroke: "#dc2626" }
    default:         return { fill: "#6b7280", stroke: "#4b5563" }
  }
}

function subnet24(ip: string | null): string | null {
  if (!ip) return null
  const parts = ip.split(".")
  if (parts.length < 3) return null
  return parts.slice(0, 3).join(".")
}

function computeLayout(devices: Device[]): Node[] {
  const n = devices.length
  if (n === 0) return []
  const cx = SVG_W / 2
  const cy = SVG_H / 2
  const r = Math.min(cx, cy) - 80
  return devices.map((d, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return {
      id: d.id,
      label: d.hostname,
      status: d.status,
      x: cx + (n === 1 ? 0 : r * Math.cos(angle)),
      y: cy + (n === 1 ? 0 : r * Math.sin(angle)),
    }
  })
}

function computeEdges(
  devices: Device[],
  interfacesByDevice: Record<string, NetworkInterface[]>
): Edge[] {
  // Build subnet → device_ids map
  const subnetMap: Record<string, string[]> = {}
  for (const dev of devices) {
    const ifaces = interfacesByDevice[dev.id] || []
    const subnets = new Set<string>()
    for (const iface of ifaces) {
      const s = subnet24(iface.ip_address)
      if (s) subnets.add(s)
    }
    if (dev.ip_address) {
      const s = subnet24(dev.ip_address)
      if (s) subnets.add(s)
    }
    for (const s of Array.from(subnets)) {
      if (!subnetMap[s]) subnetMap[s] = []
      subnetMap[s].push(dev.id)
    }
  }

  const edges: Edge[] = []
  const seen = new Set<string>()
  for (const [subnet, ids] of Object.entries(subnetMap)) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const key = [ids[i], ids[j]].sort().join("|")
        if (!seen.has(key)) {
          seen.add(key)
          edges.push({ from: ids[i], to: ids[j], subnet })
        }
      }
    }
  }
  return edges
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function TopologyPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [interfacesByDevice, setInterfacesByDevice] = useState<Record<string, NetworkInterface[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const devList = await api.getDevices()
        setDevices(devList)
        const layout = computeLayout(devList)
        const pos: Record<string, { x: number; y: number }> = {}
        for (const n of layout) pos[n.id] = { x: n.x, y: n.y }
        setPositions(pos)
        const ifaceResults = await Promise.all(
          devList.map((d) =>
            api.getInterfaces(d.id).then((ifaces) => ({ id: d.id, ifaces })).catch(() => ({ id: d.id, ifaces: [] }))
          )
        )
        const byDev: Record<string, NetworkInterface[]> = {}
        for (const { id, ifaces } of ifaceResults) byDev[id] = ifaces
        setInterfacesByDevice(byDev)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const nodes: Node[] = devices.map((d) => ({
    id: d.id,
    label: d.hostname,
    status: d.status,
    x: positions[d.id]?.x ?? SVG_W / 2,
    y: positions[d.id]?.y ?? SVG_H / 2,
  }))
  const edges = computeEdges(devices, interfacesByDevice)

  const onMouseDown = useCallback((id: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(id)
    setSelected(id)
  }, [])

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setPositions((prev) => ({ ...prev, [dragging]: { x, y } }))
  }, [dragging])

  const onMouseUp = useCallback(() => setDragging(null), [])

  const selectedDevice = selected ? devices.find((d) => d.id === selected) : null
  const selectedIfaces = selected ? (interfacesByDevice[selected] || []) : []

  if (loading) return <div className="p-8 text-gray-400">Loading topology…</div>
  if (error) return <div className="p-8 text-red-400">Error: {error}</div>

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-white">Network Topology</h1>
        <p className="text-sm text-gray-400">
          Drag nodes to rearrange. Edges represent shared /24 subnets.
        </p>
      </div>

      {devices.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No devices found. Add devices to see the topology.
        </div>
      ) : (
        <div className="flex gap-4">
          {/* SVG Canvas */}
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <svg
              ref={svgRef}
              width="100%"
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="cursor-default"
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              {/* Edges */}
              {edges.map((edge) => {
                const from = positions[edge.from]
                const to = positions[edge.to]
                if (!from || !to) return null
                return (
                  <line
                    key={`${edge.from}-${edge.to}`}
                    x1={from.x} y1={from.y}
                    x2={to.x} y2={to.y}
                    stroke="#374151"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                  />
                )
              })}

              {/* Edge subnet labels */}
              {edges.map((edge) => {
                const from = positions[edge.from]
                const to = positions[edge.to]
                if (!from || !to) return null
                const mx = (from.x + to.x) / 2
                const my = (from.y + to.y) / 2
                return (
                  <text
                    key={`label-${edge.from}-${edge.to}`}
                    x={mx} y={my - 6}
                    textAnchor="middle"
                    className="text-xs"
                    fill="#6b7280"
                    fontSize={10}
                  >
                    {edge.subnet}.0/24
                  </text>
                )
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const { fill, stroke } = statusColor(node.status)
                const pos = positions[node.id] || { x: node.x, y: node.y }
                const isSelected = selected === node.id
                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x},${pos.y})`}
                    style={{ cursor: "grab" }}
                    onMouseDown={onMouseDown(node.id)}
                  >
                    {isSelected && (
                      <circle r={NODE_R + 6} fill="none" stroke="#f59e0b" strokeWidth={2} opacity={0.6} />
                    )}
                    <circle r={NODE_R} fill={fill} stroke={stroke} strokeWidth={2} />
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      fontSize={10}
                      fontWeight="600"
                      fill="#111"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {node.label.length > 10 ? node.label.slice(0, 9) + "…" : node.label}
                    </text>
                    <text
                      textAnchor="middle"
                      y={NODE_R + 14}
                      fontSize={9}
                      fill="#9ca3af"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {node.status}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Info panel */}
          <div className="w-56 space-y-3 shrink-0">
            {/* Legend */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Legend</p>
              {(["online", "degraded", "offline", "unknown"] as const).map((s) => {
                const { fill } = statusColor(s)
                return (
                  <div key={s} className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ background: fill }} />
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                )
              })}
            </div>

            {/* Selected device detail */}
            {selectedDevice && (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Selected</p>
                <p className="text-sm font-semibold text-white truncate">{selectedDevice.hostname}</p>
                <p className="text-xs text-gray-400">{selectedDevice.ip_address}</p>
                <p className="text-xs text-gray-500">{selectedDevice.device_type}</p>
                {selectedIfaces.length > 0 && (
                  <div className="pt-1">
                    <p className="text-xs text-gray-400 mb-1">Interfaces ({selectedIfaces.length})</p>
                    {selectedIfaces.slice(0, 4).map((iface) => (
                      <p key={iface.id} className="text-xs text-gray-500 truncate">
                        {iface.name} {iface.ip_address ? `· ${iface.ip_address}` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Summary</p>
              <p className="text-xs text-gray-300">{devices.length} devices</p>
              <p className="text-xs text-gray-300">{edges.length} subnet edges</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
