"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ""

interface Message {
  role: "user" | "assistant"
  content: string
}

export function CopilotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm your AI network copilot. Ask me about device health, metric trends, or alert root causes." }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: text }])
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/v1/copilot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) throw new Error(`API error ${res.status}`)

      const contentType = res.headers.get("content-type") ?? ""

      if (contentType.includes("text/event-stream")) {
        // Streaming Ollama response
        let assistantMsg = ""
        setMessages((prev) => [...prev, { role: "assistant", content: "" }])
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value)
          for (const line of text.split("\n")) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const { token } = JSON.parse(line.slice(6))
                if (token) {
                  assistantMsg += token
                  setMessages((prev) => {
                    const copy = [...prev]
                    copy[copy.length - 1] = { role: "assistant", content: assistantMsg }
                    return copy
                  })
                }
              } catch {}
            }
          }
        }
      } else {
        // Synchronous fallback (OpenRouter)
        const data = await res.json()
        const content = data.response || "No response received."
        setMessages((prev) => [...prev, { role: "assistant", content }])
      }
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold text-xl shadow-lg transition-colors flex items-center justify-center"
        title="AI Network Copilot"
      >
        {open ? "×" : "AI"}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-96 flex flex-col">
          <Card className="bg-gray-900 border-gray-700 shadow-2xl flex flex-col max-h-[500px]">
            <CardHeader className="py-3 px-4 border-b border-gray-700">
              <CardTitle className="text-sm text-amber-400">AI Network Copilot</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  <span
                    className={`inline-block px-3 py-2 rounded-lg max-w-[85%] text-left ${
                      msg.role === "user"
                        ? "bg-amber-600/20 text-amber-100"
                        : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    {msg.content || (loading && i === messages.length - 1 ? "…" : "")}
                  </span>
                </div>
              ))}
              <div ref={bottomRef} />
            </CardContent>
            <div className="p-3 border-t border-gray-700 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Ask about your network…"
                disabled={loading}
                className="flex-1 text-sm bg-gray-800 border-gray-600"
              />
              <Button size="sm" onClick={send} disabled={loading || !input.trim()}>
                {loading ? "…" : "Send"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
