const BASE = 'https://verdant-current-6097.fly.dev';

const HEADERS = {
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  login: string;
  full_name: string;
  role: string;
  status: string;
}

export interface ApiSensor {
  sensor_id: number;
  sensor_name: string;
  sensor_type: 'temperature' | 'pressure' | 'flow' | 'heat' | 'combined';
  unit: string;
  measured_at: string | null;
  temperature_supply: number | null;
  temperature_return: number | null;
  pressure: number | null;
  flow_rate: number | null;
  heat_load: number | null;
}

export interface ApiNode {
  node_id: number;
  node_name: string;
  sensors: ApiSensor[];
}

export interface CurrentResponse {
  nodes: ApiNode[];
}

export interface LoginResponse {
  detail: string;
  user: ApiUser;
}

export interface ApiMeasurement {
  measurement_id: number;
  sensor_id: number;
  measured_at: string;
  temperature_supply: number | null;
  temperature_return: number | null;
  pressure: number | null;
  flow_rate: number | null;
  heat_load: number | null;
  sensor_name?: string;
  node_name?: string;
}

export interface ApiAlert {
  alert_id: number;
  measurement_id: number;
  alert_type: string;
  alert_level: 'warning' | 'critical' | 'emergency';
  message: string;
  created_at: string;
  status: 'active' | 'resolved';
}

export interface ApiEquipment {
  equipment_id: number;
  node_id: number;
  equipment_name: string;
  equipment_type: string;
  state: 'working' | 'stopped' | 'fault';
  last_service_date: string | null;
  node_name?: string;
}

export interface ApiReport {
  report_id: number;
  user_id: number;
  date_from: string;
  date_to: string;
  report_type: 'daily' | 'weekly' | 'monthly';
  created_at: string;
  file_path: string;
}

export interface ApiPaginated<T> {
  items?: T[];
  page?: number;
  total_pages?: number;
  total?: number;
  measurements?: T[];
  alerts?: T[];
  equipments?: T[];
  reports?: T[];
  users?: T[];
}

export interface ApiPostResponse {
  detail: string;
  id?: number;
  status?: string;
  file_path?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function parseError(res: Response): Promise<string> {
  try {
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const body = await res.json();
      return body.detail ?? res.statusText;
    }
    return `${res.status} ${res.statusText}`;
  } catch {
    return res.statusText;
  }
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

// ── POST (application/x-www-form-urlencoded) ──────────────────────────────────

export async function apiPost<T>(
  path: string,
  body: Record<string, string | number>,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      ...HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(
      Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)])),
    ).toString(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return { detail: 'OK' } as T;
}

// ── Download (blob) ──────────────────────────────────────────────────────────

export async function apiDownload(path: string): Promise<Blob> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: HEADERS,
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.blob();
}
