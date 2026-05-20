const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new ApiError(`API error ${response.status}: ${error}`, response.status);
  }
  return response.json();
}

// ── Types ──────────────────────────────────────────────────────────────────

export type DeviceType = "router" | "switch" | "firewall" | "server" | "ap" | "other";
export type DeviceStatus = "online" | "offline" | "degraded" | "unknown";

export interface Device {
  id: string;
  hostname: string;
  ip_address: string;
  device_type: DeviceType;
  vendor: string | null;
  model: string | null;
  location: string | null;
  status: DeviceStatus;
  last_seen: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeviceCreate {
  hostname: string;
  ip_address: string;
  device_type?: DeviceType;
  vendor?: string;
  model?: string;
  location?: string;
  status?: DeviceStatus;
}

export type InterfaceStatus = "up" | "down" | "unknown";

export interface NetworkInterface {
  id: string;
  device_id: string;
  name: string;
  description: string | null;
  ip_address: string | null;
  mac_address: string | null;
  speed_mbps: number | null;
  status: InterfaceStatus;
  created_at: string;
  updated_at: string;
}

export type MetricType = "latency_ms" | "packet_loss_pct" | "throughput_mbps" | "cpu_pct" | "memory_pct";

export interface MetricSample {
  id: string;
  device_id: string;
  interface_id: string | null;
  metric_type: MetricType;
  value: number;
  sampled_at: string;
  created_at: string;
}

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "open" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  device_id: string;
  severity: AlertSeverity;
  title: string;
  description: string | null;
  status: AlertStatus;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NetworkConfig {
  id: string;
  device_id: string;
  config_text: string;
  config_hash: string;
  captured_at: string;
  notes: string | null;
  compliance_notes: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_devices: number;
  online_count: number;
  offline_count: number;
  degraded_count: number;
  unknown_count: number;
  open_alerts: number;
  critical_alerts: number;
  avg_latency_ms: number | null;
}

function buildQS(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return "";
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  ) as [string, string][];
  return entries.length ? "?" + new URLSearchParams(entries).toString() : "";
}

async function fetchDelete(path: string): Promise<void> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, { method: "DELETE" });
  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    throw new ApiError(`API error ${response.status}: ${error}`, response.status);
  }
}

// ── API Functions ──────────────────────────────────────────────────────────

export const api = {
  health: () => fetchJson<{ status: string }>("/health/"),

  // Devices
  getDevices: (params?: { status?: DeviceStatus; device_type?: DeviceType; q?: string }) =>
    fetchJson<Device[]>(`/api/v1/devices/${buildQS(params)}`),
  createDevice: (data: DeviceCreate) =>
    fetchJson<Device>("/api/v1/devices/", { method: "POST", body: JSON.stringify(data) }),
  getDevice: (id: string) => fetchJson<Device>(`/api/v1/devices/${id}`),
  updateDevice: (id: string, data: Partial<DeviceCreate & { status: DeviceStatus; last_seen: string }>) =>
    fetchJson<Device>(`/api/v1/devices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDevice: (id: string) => fetchDelete(`/api/v1/devices/${id}`),

  // Interfaces
  getInterfaces: (deviceId: string) =>
    fetchJson<NetworkInterface[]>(`/api/v1/devices/${deviceId}/interfaces`),

  // Metrics
  getMetrics: (params: { device_id?: string; metric_type?: MetricType; limit?: number }) =>
    fetchJson<MetricSample[]>(`/api/v1/metrics/${buildQS(params)}`),
  ingestMetric: (data: { device_id: string; metric_type: MetricType; value: number }) =>
    fetchJson<MetricSample>("/api/v1/metrics/", { method: "POST", body: JSON.stringify(data) }),

  // Alerts
  getAlerts: (params?: { status?: AlertStatus; severity?: AlertSeverity; device_id?: string }) =>
    fetchJson<Alert[]>(`/api/v1/alerts/${buildQS(params)}`),
  createAlert: (data: { device_id: string; severity: AlertSeverity; title: string; description?: string }) =>
    fetchJson<Alert>("/api/v1/alerts/", { method: "POST", body: JSON.stringify(data) }),
  updateAlert: (id: string, data: { status?: AlertStatus; severity?: AlertSeverity; title?: string; description?: string }) =>
    fetchJson<Alert>(`/api/v1/alerts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteAlert: (id: string) => fetchDelete(`/api/v1/alerts/${id}`),

  // Configs
  getConfigs: (deviceId: string) =>
    fetchJson<NetworkConfig[]>(`/api/v1/devices/${deviceId}/configs`),
  captureConfig: (data: { device_id: string; config_text: string; notes?: string }) =>
    fetchJson<NetworkConfig>("/api/v1/configs/", { method: "POST", body: JSON.stringify(data) }),

  // Dashboard
  getDashboard: () => fetchJson<DashboardStats>("/api/v1/dashboard/"),
};

export { ApiError };
