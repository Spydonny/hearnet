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

// ── Helpers ──────────────────────────────────────────────────────────────────

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.detail ?? res.statusText;
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
  return res.json();
}
