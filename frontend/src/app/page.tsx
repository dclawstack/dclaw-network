import Link from "next/link"
import { SeedControls } from "@/components/SeedControls"

/* ─── Icon components (inline SVG, zero dependencies) ─── */

function IconNetwork() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <circle cx="12" cy="5" r="2.5" /><circle cx="4" cy="19" r="2.5" /><circle cx="20" cy="19" r="2.5" />
      <path d="M12 7.5v4M12 11.5l-6 5M12 11.5l6 5" strokeLinecap="round" />
    </svg>
  )
}
function IconBrain() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path d="M9.5 2a4.5 4.5 0 0 1 4.5 4.5v.5h1a3 3 0 0 1 0 6h-1v.5a4.5 4.5 0 0 1-9 0V6.5A4.5 4.5 0 0 1 9.5 2Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 9H17a3 3 0 0 1 0 6h-2.5" strokeLinecap="round" />
    </svg>
  )
}
function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconTrend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path d="M3 17l4-4 4 4 4-5 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 7h-4v4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconMap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <polygon points="3,6 9,3 15,6 21,3 21,18 15,21 9,18 3,21" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="9" y1="3" x2="9" y2="18" strokeLinecap="round" />
      <line x1="15" y1="6" x2="15" y2="21" strokeLinecap="round" />
    </svg>
  )
}
function IconChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconStream() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path d="M5 12h14M5 6h14M5 18h14" strokeLinecap="round" />
      <circle cx="19" cy="6" r="2" fill="currentColor" stroke="none" className="text-amber-400" />
    </svg>
  )
}
function IconZap() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function IconArrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 inline ml-1">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ─── Feature data ─── */

const features = [
  {
    icon: <IconNetwork />,
    title: "Real-time Device Monitoring",
    desc: "Track every device — routers, switches, firewalls, servers — with live status, latency, CPU, memory, and packet-loss metrics updated every minute.",
    tag: "Core",
  },
  {
    icon: <IconBrain />,
    title: "AI Anomaly Detection",
    desc: "Builds a rolling 7-day statistical baseline per device per metric. A Z-score above 3σ automatically fires an anomaly alert — no manual threshold tuning.",
    tag: "AI",
  },
  {
    icon: <IconTrend />,
    title: "Outage Prediction",
    desc: "EWMA trend analysis on latency and packet loss. If a metric is on track to double within 30 minutes, DClaw Network warns you before the outage hits.",
    tag: "AI",
  },
  {
    icon: <IconZap />,
    title: "LLM Root-Cause Analysis",
    desc: "Every alert is automatically enriched with a plain-English root-cause explanation and a remediation suggestion, generated from the last 30 minutes of metrics.",
    tag: "AI",
  },
  {
    icon: <IconShield />,
    title: "Config Compliance AI",
    desc: "Paste or capture a device config and the AI checks for open Telnet, weak credentials, missing logging, and permissive ACLs — in seconds.",
    tag: "AI",
  },
  {
    icon: <IconMap />,
    title: "Network Topology Graph",
    desc: "Interactive SVG topology with draggable device nodes colored by health status and edges inferred from shared /24 subnets. No extra tools needed.",
    tag: "Visual",
  },
  {
    icon: <IconStream />,
    title: "Live Alert Stream",
    desc: "Server-Sent Events push critical alerts to every connected browser tab in real time — with OS notifications and automatic reconnect on disconnect.",
    tag: "Real-time",
  },
  {
    icon: <IconChat />,
    title: "AI Network Copilot",
    desc: "Chat with your network. Ask ‘Which devices had packet loss > 5% last hour?’ and get answers backed by live metric data and active alerts.",
    tag: "AI",
  },
]

const tagColor: Record<string, string> = {
  AI: "bg-violet-500/20 text-violet-300 border border-violet-500/30",
  Core: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  Visual: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  "Real-time": "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
}

const steps = [
  {
    n: "01",
    title: "Connect your devices",
    desc: "Add devices via the dashboard or REST API. DClaw Network immediately starts collecting latency, packet loss, CPU, and memory metrics.",
  },
  {
    n: "02",
    title: "AI learns your baseline",
    desc: "After a few days of data, the anomaly detector builds per-device baselines. The prediction engine starts flagging degradation trends.",
  },
  {
    n: "03",
    title: "Get warned before outages",
    desc: "Receive predictive alerts up to 30 minutes before an outage, with AI-written root-cause explanations and remediation steps — so your team acts fast.",
  },
]

const stats = [
  { value: "5 min", label: "alert engine poll" },
  { value: "7 day", label: "anomaly baseline" },
  { value: "~28 min", label: "avg prediction lead" },
  { value: "Z > 3σ", label: "anomaly threshold" },
]

/* ─── Landing page ─── */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* ── Nav ── */}
      <header className="border-b border-gray-800/60 sticky top-0 z-50 backdrop-blur-md bg-gray-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-xl tracking-tight">DClaw Network</span>
            <span className="ml-2 text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">v0.1.0</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#ai" className="hover:text-white transition-colors">AI Copilot</a>
          </nav>
          <Link
            href="/dashboard"
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Open Dashboard
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-32 px-6">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/4 w-[400px] h-[300px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm px-4 py-1.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            AI-Powered Network Intelligence · YC S25/W26
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
            Monitor, Predict,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              and Resolve
            </span>{" "}
            <br className="hidden md:block" />
            Network Issues
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            DClaw Network gives your team real-time visibility, statistical anomaly detection,
            AI-generated root-cause analysis, and outage prediction — all in one open platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              href="/dashboard"
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
            >
              Open Dashboard <IconArrow />
            </Link>
            <a
              href="#features"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* Hero visual — terminal / metrics preview */}
        <div className="relative max-w-4xl mx-auto mt-20">
          <div className="rounded-2xl border border-gray-800 bg-gray-900/80 overflow-hidden shadow-2xl shadow-black/60">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <span className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-3 text-xs text-gray-500">DClaw Network · Dashboard</span>
            </div>
            {/* Fake dashboard content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total Devices", value: "42", sub: "8 types" },
                  { label: "Online", value: "39", sub: "2 degraded · 1 offline" },
                  { label: "Open Alerts", value: "3", sub: "1 critical" },
                  { label: "Avg Latency", value: "18.4 ms", sub: "last hour" },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/50">
                    <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                    <div className="text-xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800/40 rounded-lg p-3 border border-gray-700/40 space-y-2">
                <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">Recent Alerts</div>
                {[
                  { sev: "critical", sev_color: "bg-red-500/20 text-red-300", title: "Anomaly detected: latency_ms = 847.3", time: "2 min ago" },
                  { sev: "warning", sev_color: "bg-yellow-500/20 text-yellow-300", title: "Predicted degradation: packet_loss_pct in ~18min", time: "9 min ago" },
                  { sev: "warning", sev_color: "bg-yellow-500/20 text-yellow-300", title: "cpu_pct threshold exceeded: 92.1%", time: "23 min ago" },
                ].map((a, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.sev_color}`}>{a.sev}</span>
                      <span className="text-gray-300">{a.title}</span>
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow under hero card */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-amber-500/10 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-y border-gray-800 bg-gray-900/40 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-amber-400">{s.value}</div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="text-amber-400 font-semibold text-sm uppercase tracking-widest">Everything you need</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">Built for modern network teams</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              From threshold alerts to AI-generated incident reports — DClaw Network covers the full observability stack.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-amber-500/40 hover:bg-gray-900/80 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-amber-400 group-hover:text-amber-300 transition-colors">{f.icon}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor[f.tag]}`}>{f.tag}</span>
                </div>
                <h3 className="font-semibold text-white mb-2 text-base leading-snug">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="py-28 px-6 bg-gray-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="text-amber-400 font-semibold text-sm uppercase tracking-widest">Simple by design</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white">From zero to AI-powered alerts</h2>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">No agents to install. No YAML to write. Just add your devices and let the AI go to work.</p>
          </div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[calc(16.7%-1px)] right-[calc(16.7%-1px)] h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

            <div className="grid md:grid-cols-3 gap-10">
              {steps.map((step) => (
                <div key={step.n} className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gray-800 border border-gray-700 mx-auto relative">
                    <span className="text-3xl font-extrabold text-amber-400">{step.n}</span>
                    <div className="absolute inset-0 rounded-2xl bg-amber-400/5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Copilot spotlight ── */}
      <section id="ai" className="py-28 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="text-amber-400 font-semibold text-sm uppercase tracking-widest">AI Copilot</div>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Talk to your network in plain English
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              The AI Copilot plugs into your live metrics and active alerts. Ask any question —
              it queries real data and responds in natural language. No dashboards to navigate,
              no query languages to learn.
            </p>
            <ul className="space-y-3">
              {[
                "Which devices had packet loss > 5% last hour?",
                "Summarise all critical alerts from today",
                "What is the root cause of the latency spike on core-sw-01?",
                "Is core-fw-02 showing any anomalies?",
              ].map((q) => (
                <li key={q} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="text-amber-400 mt-0.5">→</span>
                  <span className="italic">"{q}"</span>
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 font-semibold text-sm transition-colors"
            >
              Try the Copilot in the app <IconArrow />
            </Link>
          </div>

          {/* Chat mockup */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400 font-medium">AI Network Copilot</span>
            </div>
            <div className="p-5 space-y-4 text-sm">
              {/* User message */}
              <div className="flex justify-end">
                <div className="bg-amber-500/15 border border-amber-500/20 text-amber-100 px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-xs">
                  Which devices had packet loss &gt; 5% last hour?
                </div>
              </div>
              {/* AI response */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0 text-xs font-bold text-violet-300">AI</div>
                <div className="bg-gray-800 border border-gray-700 text-gray-200 px-4 py-3 rounded-2xl rounded-tl-sm flex-1 leading-relaxed space-y-2">
                  <p>I found <strong className="text-white">2 devices</strong> with packet loss above 5% in the last hour:</p>
                  <div className="bg-gray-900/70 rounded-lg p-2.5 space-y-1.5 font-mono text-xs text-gray-300">
                    <div className="flex justify-between">
                      <span className="text-amber-300">edge-rtr-03</span>
                      <span className="text-red-400">12.4% avg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-300">dist-sw-07</span>
                      <span className="text-yellow-400">6.8% avg</span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs">Both have open warning alerts. edge-rtr-03 shows a rising EWMA trend — outage predicted in ~22 min.</p>
                </div>
              </div>
              {/* typing indicator */}
              <div className="flex gap-3 opacity-60">
                <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0" />
                <div className="bg-gray-800 border border-gray-700 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
                <span className="flex-1 text-sm text-gray-500">Ask anything about your network…</span>
                <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-950">
                    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Prediction spotlight ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-gray-900/30 to-gray-950">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm px-4 py-1.5 rounded-full font-medium">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full" />
            YC Demo Moment
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            28 minutes before the outage
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
            DClaw Network's EWMA trend engine detected rising latency on <code className="text-amber-300 bg-gray-800 px-1.5 py-0.5 rounded text-base">edge-rtr-03</code> and
            predicted the outage 28 minutes before it happened — giving your team a full window to act.
          </p>
          <div className="grid md:grid-cols-3 gap-4 pt-4">
            {[
              { icon: "📡", title: "Metric ingested", desc: "latency_ms rising — EWMA trend computed", t: "T − 28 min" },
              { icon: "⚠️", title: "Predictive alert fired", desc: "\"Predicted degradation: latency_ms in ~28min\"", t: "T − 28 min" },
              { icon: "🤖", title: "RCA generated", desc: "AI explained cause and suggested BGP route refresh", t: "T − 27 min" },
            ].map((e) => (
              <div key={e.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-left space-y-2">
                <div className="text-2xl">{e.icon}</div>
                <div className="text-xs text-gray-500 font-mono">{e.t}</div>
                <div className="font-semibold text-white">{e.title}</div>
                <div className="text-sm text-gray-400">{e.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ready to get full network visibility?
          </h2>
          <p className="text-gray-400 text-lg">
            Open the dashboard, add your first device, and watch the AI start building your baseline.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 shadow-lg shadow-amber-500/20"
            >
              Open Dashboard <IconArrow />
            </Link>
            <Link
              href="/devices"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Add your first device
            </Link>
          </div>
        </div>
      </section>

      {/* ── SEED CONTROLS — remove this block (and the SeedControls import above) to hide ── */}
      <section className="py-12 px-6 border-t border-gray-800/60">
        <div className="max-w-lg mx-auto">
          <SeedControls />
        </div>
      </section>
      {/* ── END SEED CONTROLS ── */}

      {/* ── Footer ── */}
      <footer className="border-t border-gray-800 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold text-lg">DClaw Network</span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500 text-sm">v0.1.0 · dclaw_network</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-300 transition-colors">Dashboard</Link>
            <Link href="/devices" className="hover:text-gray-300 transition-colors">Devices</Link>
            <Link href="/alerts" className="hover:text-gray-300 transition-colors">Alerts</Link>
            <Link href="/performance" className="hover:text-gray-300 transition-colors">Performance</Link>
            <Link href="/topology" className="hover:text-gray-300 transition-colors">Topology</Link>
            <Link href="/configs" className="hover:text-gray-300 transition-colors">Configs</Link>
          </nav>
          <div className="text-gray-600 text-sm">
            Built with FastAPI · Next.js 14 · PostgreSQL
          </div>
        </div>
      </footer>
    </div>
  )
}
