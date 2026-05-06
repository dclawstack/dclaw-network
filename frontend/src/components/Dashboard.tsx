"use client";

import { useState } from "react";
import { Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NetworkReport {
  id: string;
  segment: string;
  uptime_percent: number;
  bandwidth_utilization: number;
  latency_ms: number;
  optimization_suggestions: string[];
  created_at: string
}

export default function Dashboard() {
  const [segment, setSegment] = useState("");
  const [networkReport, setNetworkReport] = useState<NetworkReport | null>(null);
  const [extraData, setExtraData] = useState<any>(null);
const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!segment) return;
    setLoading(true);
    try {
      const res = await fetch("/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        segment: segment,
        }),
      });
      const data = await res.json();
      setNetworkReport(data);
      const extraRes = await fetch(`/reports/${data.id}/topology`);
      const extraData = await extraRes.json();
      setExtraData(extraData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Network className="w-8 h-8" style={{ color: "#0891B2" }} />
        <div>
          <h1 className="text-2xl font-bold">DClaw Network</h1>
          <p className="text-sm text-slate-500">Network monitoring and optimization</p>
        </div>
        <Badge className="ml-auto" style={{ backgroundColor: "#0891B2" }}>IT</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analyze</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Network segment</label>
              <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="e.g. US-East-1" />
            </div>

          </div>
          <Button onClick={handleSubmit} disabled={loading || !segment}>
            {loading ? "Processing..." : "Analyze"}
          </Button>
        </CardContent>
      </Card>

      {networkReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <Card>
            <CardHeader>
              <CardTitle>Report Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>ID:</strong> {networkReport.id}</p>
              <p><strong>Segment:</strong> {networkReport.segment}</p>
              <p><strong>Uptime %:</strong> {networkReport.uptime_percent.toFixed(2) + '%'}</p>
              <p><strong>Bandwidth Utilization:</strong> {networkReport.bandwidth_utilization.toFixed(1) + '%'}</p>
              <p><strong>Latency:</strong> {networkReport.latency_ms.toFixed(1) + ' ms'}</p>
              <p><strong>Created:</strong> {new Date(networkReport.created_at).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {networkReport.optimization_suggestions.map((item: string, i: number) => (
                  <Badge key={i} variant="secondary">{item}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Network Topology</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{extraData?.topology}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
