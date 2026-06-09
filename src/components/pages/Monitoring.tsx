import { useState, useEffect } from 'react';
import {
  LineChart, Line, ResponsiveContainer, Tooltip,
} from 'recharts';
import { Thermometer, Gauge, Droplets, Wind, Zap } from 'lucide-react';
import { apiGet } from '../../utils/api';
import type { CurrentResponse, ApiSensor } from '../../utils/api';

interface Sensor {
  id: number;
  name: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  normalMin: number;
  normalMax: number;
  icon: React.ElementType;
  history: { v: number }[];
  node: string;
}


function makeHistory(base: number, spread: number): { v: number }[] {
  return Array.from({ length: 12 }, () => ({ v: +(base + (Math.random() - 0.5) * spread).toFixed(2) }));
}

const INITIAL_SENSORS: Sensor[] = [
  { id: 1, name: 'Температура подачи',   unit: '°C',  value: 74.5, min: 60,   max: 100, normalMin: 65,  normalMax: 95,  icon: Thermometer, history: makeHistory(74, 4),   node: 'ЦТП-1' },
  { id: 2, name: 'Температура обратки',  unit: '°C',  value: 54.2, min: 40,   max: 80,  normalMin: 45,  normalMax: 75,  icon: Thermometer, history: makeHistory(54, 3),   node: 'ЦТП-1' },
  { id: 3, name: 'Давление подачи',       unit: 'МПа', value: 0.62, min: 0.1,  max: 1.2, normalMin: 0.4, normalMax: 1.0, icon: Gauge,       history: makeHistory(0.62, 0.1), node: 'ЦТП-1' },
  { id: 4, name: 'Давление обратки',      unit: 'МПа', value: 0.45, min: 0.1,  max: 1.0, normalMin: 0.3, normalMax: 0.8, icon: Gauge,       history: makeHistory(0.45, 0.08), node: 'ЦТП-1' },
  { id: 5, name: 'Расход теплоносителя', unit: 'т/ч', value: 12.4, min: 0,    max: 30,  normalMin: 5,   normalMax: 25,  icon: Droplets,    history: makeHistory(12.4, 2), node: 'ЦТП-2' },
  { id: 6, name: 'Температура подачи',   unit: '°C',  value: 71.8, min: 60,   max: 100, normalMin: 65,  normalMax: 95,  icon: Thermometer, history: makeHistory(72, 4),   node: 'ЦТП-2' },
  { id: 7, name: 'Давление подачи',       unit: 'МПа', value: 0.58, min: 0.1,  max: 1.2, normalMin: 0.4, normalMax: 1.0, icon: Gauge,       history: makeHistory(0.58, 0.1), node: 'ЦТП-2' },
  { id: 8, name: 'Скорость потока',       unit: 'м/с', value: 1.24, min: 0,    max: 3,   normalMin: 0.5, normalMax: 2.5, icon: Wind,        history: makeHistory(1.24, 0.2), node: 'НС-4' },
  { id: 9, name: 'Мощность насоса',       unit: 'кВт', value: 18.6, min: 0,    max: 40,  normalMin: 5,   normalMax: 35,  icon: Zap,         history: makeHistory(18.6, 3), node: 'НС-4' },
  { id: 10, name: 'Расход теплоносителя', unit: 'т/ч', value: 9.8,  min: 0,    max: 30,  normalMin: 5,   normalMax: 25,  icon: Droplets,    history: makeHistory(9.8, 2),  node: 'ЦТП-3' },
  { id: 11, name: 'Температура обратки',  unit: '°C',  value: 52.1, min: 40,   max: 80,  normalMin: 45,  normalMax: 75,  icon: Thermometer, history: makeHistory(52, 3),   node: 'ЦТП-3' },
  { id: 12, name: 'Давление обратки',     unit: 'МПа', value: 0.41, min: 0.1,  max: 1.0, normalMin: 0.3, normalMax: 0.8, icon: Gauge,       history: makeHistory(0.41, 0.08), node: 'ТУ-5' },
];

const NODE_COLORS: Record<string, string> = {
  'ЦТП-1': 'bg-blue-100 text-blue-700',
  'ЦТП-2': 'bg-violet-100 text-violet-700',
  'ЦТП-3': 'bg-emerald-100 text-emerald-700',
  'НС-4':  'bg-amber-100 text-amber-700',
  'ТУ-5':  'bg-pink-100 text-pink-700',
};

// Maps one API sensor to one or more Sensor cards.
// Combined sensors emit a card per non-null field; all others emit one card.
function apiSensorToCards(s: ApiSensor, nodeName: string, startId: number): Sensor[] {
  const cards: Sensor[] = [];

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

  // For combined sensors show every field that has a value; for others show the primary one.
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
    if (rawVal == null || typeof rawVal !== 'number') return;
    const def = fieldDefs.find(f => f.key === key)!;
    cards.push({
      id: startId + idx,
      name: keysToShow.length > 1 ? `${s.sensor_name} · ${def.label}` : s.sensor_name,
      unit: key === 'pressure' ? 'МПа' : key === 'heat_load' ? 'Гкал/ч' : key === 'flow_rate' ? 'м³/ч' : (s.unit || def.unit),
      value: +rawVal.toFixed(2),
      min: def.min, max: def.max,
      normalMin: def.normalMin, normalMax: def.normalMax,
      icon: def.icon,
      history: makeHistory(rawVal, (def.max - def.min) * 0.04),
      node: nodeName,
    });
  });

  return cards;
}

export default function Monitoring() {
  const [sensors, setSensors] = useState<Sensor[]>(INITIAL_SENSORS);
  const [filterNode, setFilterNode] = useState('Все');

  // Fetch real sensors on mount; fall back silently to INITIAL_SENSORS if API fails.
  useEffect(() => {
    async function loadRealSensors() {
      try {
        const data = await apiGet<CurrentResponse>('/api/current');
        const mapped: Sensor[] = [];
        let id = 1;
        for (const node of data.nodes) {
          for (const s of node.sensors) {
            const cards = apiSensorToCards(s, node.node_name, id);
            mapped.push(...cards);
            id += cards.length;
          }
        }
        if (mapped.length > 0) setSensors(mapped);
      } catch {
        // backend unreachable — keep INITIAL_SENSORS
      }
    }
    loadRealSensors();
  }, []);

  // Live simulation tick (nudges values slightly every 3 s regardless of data source).
  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => prev.map(s => {
        const newVal = +(s.value + (Math.random() - 0.5) * (s.max - s.min) * 0.03).toFixed(2);
        const clamped = Math.max(s.min, Math.min(s.max, newVal));
        return {
          ...s,
          value: clamped,
          history: [...s.history.slice(-11), { v: clamped }],
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const nodes = ['Все', ...Array.from(new Set(sensors.map(s => s.node)))];
  const visible = filterNode === 'Все' ? sensors : sensors.filter(s => s.node === filterNode);

  function isNormal(s: Sensor) {
    return s.value >= s.normalMin && s.value <= s.normalMax;
  }

  const normalCount  = sensors.filter(isNormal).length;
  const warnCount    = sensors.length - normalCount;

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Мониторинг датчиков</h1>
          <p className="text-sm text-slate-500 mt-0.5">Показания обновляются каждые 3 секунды</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Норма: {normalCount}
          </span>
          {warnCount > 0 && (
            <span className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Отклонение: {warnCount}
            </span>
          )}
        </div>
      </div>

      {/* Node filter */}
      <div className="flex gap-2 flex-wrap">
        {nodes.map(n => (
          <button
            key={n}
            onClick={() => setFilterNode(n)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors
              ${filterNode === n
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'}`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Sensor cards */}
      <div className="grid grid-cols-3 gap-4">
        {visible.map(sensor => {
          const normal  = isNormal(sensor);
          const pct     = ((sensor.value - sensor.min) / (sensor.max - sensor.min)) * 100;
          const Icon    = sensor.icon;

          return (
            <div
              key={sensor.id}
              className={`bg-white border rounded-xl p-4 transition-colors ${normal ? 'border-slate-200' : 'border-red-300'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${normal ? 'bg-blue-50' : 'bg-red-50'}`}>
                    <Icon size={15} className={normal ? 'text-blue-600' : 'text-red-500'} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-700 leading-tight">{sensor.name}</div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${NODE_COLORS[sensor.node] ?? 'bg-slate-100 text-slate-600'}`}>
                      {sensor.node}
                    </span>
                  </div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${normal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {normal ? 'Норма' : 'Откл.'}
                </span>
              </div>

              {/* Value */}
              <div className="flex items-end gap-1.5 mb-3">
                <span className={`text-2xl font-bold tabular-nums ${normal ? 'text-slate-800' : 'text-red-600'}`}>
                  {sensor.unit === 'МПа' ? sensor.value.toFixed(2) : sensor.value.toFixed(1)}
                </span>
                <span className="text-sm text-slate-400 mb-0.5">{sensor.unit}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${normal ? 'bg-blue-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                />
              </div>

              {/* Sparkline */}
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensor.history} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Tooltip
                      contentStyle={{ fontSize: 10, borderRadius: 6, border: '1px solid #e2e8f0', padding: '2px 6px' }}
                      formatter={(v) => [`${v} ${sensor.unit}`]}
                      labelFormatter={() => ''}
                    />
                    <Line
                      type="monotone" dataKey="v"
                      stroke={normal ? '#2563eb' : '#ef4444'}
                      strokeWidth={1.5} dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Мин: {sensor.normalMin} {sensor.unit}</span>
                <span>Макс: {sensor.normalMax} {sensor.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
