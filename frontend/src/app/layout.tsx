import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import { CopilotWidget } from "@/components/CopilotWidget"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DClaw Network",
  description: "Network monitoring, topology mapping, and AI-driven anomaly detection",
}

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/devices", label: "Devices" },
  { href: "/alerts", label: "Alerts" },
  { href: "/performance", label: "Performance" },
  { href: "/configs", label: "Configs" },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
            <div className="px-5 py-5 border-b border-gray-800">
              <span className="text-amber-400 font-bold text-lg">DClaw Network</span>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2 rounded-md text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4 border-t border-gray-800 text-xs text-gray-500">
              v0.1.0 · dclaw_network
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
        <CopilotWidget />
      </body>
    </html>
  )
}
