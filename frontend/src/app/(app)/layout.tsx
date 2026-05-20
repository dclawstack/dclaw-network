import { CopilotWidget } from "@/components/CopilotWidget"
import { SidebarNav } from "@/components/SidebarNav"
import Link from "next/link"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="flex min-h-screen">
        <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
          <div className="px-5 py-5 border-b border-gray-800">
            <Link href="/" className="text-amber-400 font-bold text-lg hover:text-amber-300 transition-colors">
              DClaw Network
            </Link>
          </div>
          <SidebarNav />
          <div className="px-5 py-4 border-t border-gray-800 text-xs text-gray-500">
            v0.1.0 · dclaw_network
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <CopilotWidget />
    </>
  )
}
