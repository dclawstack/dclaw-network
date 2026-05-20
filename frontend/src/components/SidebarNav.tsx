"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/devices", label: "Devices" },
  { href: "/alerts", label: "Alerts" },
  { href: "/performance", label: "Performance" },
  { href: "/configs", label: "Configs" },
  { href: "/topology", label: "Topology" },
]

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

export function SidebarNav() {
  const pathname = usePathname()
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const es = new EventSource(`${API_BASE}/api/v1/stream/alerts`)
    esRef.current = es

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === "alert" && data.severity === "critical") {
          // Browser notification (if permitted) or console log as fallback
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`⚠ Critical Alert: ${data.hostname}`, { body: data.title })
          } else {
            console.warn("[DClaw SSE] Critical alert:", data.title)
          }
        }
      } catch {}
    }

    es.onerror = () => {
      // Browser reconnects automatically; no action needed
    }

    return () => {
      es.close()
    }
  }, [])

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`block px-3 py-2 rounded-md text-sm transition-colors ${
            isActive(link.href)
              ? "bg-amber-500/20 text-amber-300 font-medium"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
