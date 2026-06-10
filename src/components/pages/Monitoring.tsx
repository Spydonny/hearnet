import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
} from 'recharts';
import { Thermometer, Gauge, Droplets, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../utils/api';
import type { CurrentResponse, ApiSensor } from '../../utils/api';

interface SensorCard {
  id: number;
  name: string;
  unit: string;
  value: number | null;
  min: number;
  max: number;
  normalMin: number;
  normalMax: number;
  icon: React.ElementType;
  history: { v: number | null }[];
  node: string;
  node_id: number;
  sensor_id: number;
  sensor_type: string;
}

function apiSensorToCards(s: ApiSensor, nodeName: string, nodeId: number, startId: number): SensorCard[] {
  const cards: SensorCard[] = [];

  const fieldDefs: {
    key: keyof ApiSensor;
    label: string;
    unit: string;
    min: number; max: number; normalMin: number; normalMax: number;
    icon: React.ElementType;
  }[] = [
    { key: 'temperature_supply', label: 'Температура подачи',   unit: '°C',     min: 40,  max: 120, normalMin: 60,  normalMax: 95,  icon: Thermometer },
    { key: 'temperature_return', label: 'Температура обратки',  unit: '°C',     min: 30,  max: 90,  normalMin: 40,  normalMax: 75,  icon: Thermometer },
    { key: 'pressure',           label: 'Давление',              unit: 'МПа',    min: 0,   max: 1.5, normalMin: 0.4, normalMax: 1.0, icon: Gauge       },
    { key: 'flow_rate',          label: 'Расход',                unit: 'м³/ч',   min: 0,   max: 500, normalMin: 10,  normalMax: 300, icon: Droplets    },
    { key: 'heat_load',          label: 'Тепловая нагрузка',    unit: 'Гкал/ч', min: 0,   max: 20,  normalMin: 0.5, normalMax: 10,  icon: Zap         },
  ];

  const keysToShow: (keyof ApiSensor)[] =
    s.sensor_type === 'combined'
      ? fieldDefs.map(f => f.key).filter(k => s[k] != null)
      : s.sensor_type === 'temperature' ? ['temperature_supply', 'temperature_return']
      : s.sensor_type === 'pressure'    ? ['pressure']
      : s.sensor_type === 'flow'        ? ['flow_rate']
      : s.sensor_type === 'heat'        ? ['heat_load']
      : fieldDefs.map(f => f.key).filter(k => s[k] != null);

  keysToShow.forEach((key, idx) => {
    const rawVal = s[key];
    const def = fieldDefs.find(f => f.key === key)!;
    cards.push({
      id: startId + idx,
      name: keysToShow.length > 1 ? `${s.sensor_name} · ${def.label}` : s.sensor_name,
      unit: key === 'pressure' ? 'МПа' : key === 'heat_load' ? 'Гкал/ч' : key === 'flow_rate' ? 'м³/ч' : (s.unit || def.unit),
      value: rawVal != null && typeof rawVal === 'number' ? +rawVal.toFixed(2) : null,
      min: def.min, max: def.max,
      normalMin: def.normalMin, normalMax: def.normalMax,
      icon: def.icon,
      history: [],
      node: nodeName,
      node_id: nodeId,
      sensor_id: s.sensor_id,
      sensor_type: s.sensor_type,
    });
  });

  return cards;
}

const NODE_COLORS: Record<string, string> = {};
const colorPalette = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
];
let colorIdx = 0;

export default function Monitoring() {
  const [sensors, setSensors] = useState<SensorCard[]>([]);
  const [filterNode, setFilterNode] = useState('Все');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await apiGet<CurrentResponse>('/api/current');
      const mapped: SensorCard[] = [];
      let id = 1;
      for (const node of data.nodes) {
        if (!NODE_COLORS[node.node_name]) {
          NODE_COLORS[node.node_name] = colorPalette[colorIdx % colorPalette.length];
          colorIdx++;
        }
        for (const s of node.sensors) {
          const cards = apiSensorToCards(s, node.node_name, node.node_id, id);
          mapped.push(...cards);
          id += cards.length;
        }
      }

      setSensors(prev => {
        const prevMap = new Map(prev.map(s => [`${s.node_id}-${s.sensor_id}-${s.name}`, s.history]));
        return mapped.map(s => {
          const key = `${s.node_id}-${s.sensor_id}-${s.name}`;
          const oldHistory = prevMap.get(key) ?? [];
          const newPoint = { v: s.value };
          return { ...s, history: [...oldHistory.slice(-59), newPoint] };
        });
      });

      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
      if (sensors.length === 0) setError('Не удалось загрузить данные датчиков');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const nodes = ['Все', ...Array.from(new Set(sensors.map(s => s.node)))];
  const visible = filterNode === 'Все' ? sensors : sensors.filter(s => s.node === filterNode);

  function isNormal(s: SensorCard) {
    return s.value != null && s.value >= s.normalMin && s.value <= s.normalMax;
  }

  const normalCount = sensors.filter(isNormal).length;
  const warnCount = sensors.length - normalCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">Загрузка датчиков...</span>
      </div>
    );
  }

  if (error && sensors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle size={32} className="text-red-400 mb-3" />
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
        <button onClick={fetchData} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">Повторить</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">Мониторинг датчиков</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Показания обновляются каждые 3 секунды</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Норма: {normalCount}
          </span>
          {warnCount > 0 && (
            <span className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Отклонение: {warnCount}
            </span>
          )}
        </div>
      </div>

      {nodes.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {nodes.map(n => (
            <button
              key={n}
              onClick={() => setFilterNode(n)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
                ${filterNode === n
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'}`}
            >
              {n}
            </button>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-400 dark:text-slate-500">Нет данных для отображения</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {visible.map(sensor => {
            const normal = isNormal(sensor);
            const pct = sensor.value != null ? ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100 : 0;
            const Icon = sensor.icon;

            return (
              <div
                key={sensor.id}
                className={`bg-white dark:bg-slate-800 border rounded-xl p-4 transition-colors ${normal ? 'border-slate-200 dark:border-slate-700' : 'border-red-300 dark:border-red-700'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${normal ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
                      <Icon size={15} className={normal ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-tight">{sensor.name}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${NODE_COLORS[sensor.node] ?? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {sensor.node}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${normal ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'}`}>
                    {normal ? 'Норма' : 'Откл.'}
                  </span>
                </div>

                <div className="flex items-end gap-1.5 mb-3">
                  <span className={`text-2xl font-bold tabular-nums ${normal ? 'text-slate-800 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                    {sensor.value != null
                      ? (sensor.unit === 'МПа' ? sensor.value.toFixed(2) : sensor.value.toFixed(1))
                      : '—'}
                  </span>
                  <span className="text-sm text-slate-400 dark:text-slate-500 mb-0.5">{sensor.unit}</span>
                </div>

                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mb-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${normal ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                  />
                </div>

                <div className="h-12">
                  {sensor.history.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-xs text-slate-300 dark:text-slate-600">Нет истории</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sensor.history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                        <Tooltip
                          contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #334155', background: '#1e293b', padding: '2px 6px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          formatter={(v) => [`${v} ${sensor.unit}`]}
                          labelFormatter={() => ''}
                        />
                        <Line
                          type="monotone" dataKey="v"
                          stroke={normal ? '#3b82f6' : '#ef4444'}
                          strokeWidth={1.5} dot={false} connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
                  <span>Мин: {sensor.normalMin} {sensor.unit}</span>
                  <span>Макс: {sensor.normalMax} {sensor.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
