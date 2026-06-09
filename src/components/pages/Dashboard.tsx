import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Thermometer, Gauge, AlertTriangle, Activity } from 'lucide-react';
import { apiGet } from '../../utils/api';
import type { CurrentResponse } from '../../utils/api';

interface Reading { time: string; supplyTemp: number; returnTemp: number; pressure: number; }
interface AlertItem { id: number; message: string; severity: 'critical' | 'warning'; time: string; }

function generateHistory(sup: number, ret: number, pres: number): Reading[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const t = new Date(now.getTime() - (11 - i) * 5 * 60 * 1000);
    const lbl = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    const n = (r: number) => +((Math.random() - 0.5) * r).toFixed(2);
    return {
      time: lbl,
      supplyTemp: +(sup + n(4)).toFixed(1),
      returnTemp: +(ret + n(3)).toFixed(1),
      pressure: Math.max(0.05, +(pres + n(0.08)).toFixed(2)),
    };
  });
}

const INIT_ALERTS: AlertItem[] = [
  { id: 1, message: 'Повышенный расход теплоносителя — ЦТП-2', severity: 'warning', time: '08:45' },
  { id: 2, message: 'Плановое ТО насосной станции НС-4 — завтра 09:00', severity: 'warning', time: '07:30' },
];

export default function Dashboard() {
  const [supplyTemp, setSupplyTemp]   = useState(75);
  const [returnTemp, setReturnTemp]   = useState(55);
  const [pressure,   setPressure]     = useState(0.6);
  const [chartData,  setChartData]    = useState<Reading[]>([]);
  const [alerts,     setAlerts]       = useState<AlertItem[]>(INIT_ALERTS);

  // Initialise from live API; fall back to mock values if backend is unreachable.
  useEffect(() => {
    async function init() {
      try {
        const data = await apiGet<CurrentResponse>('/api/current');
        const sensor = data.nodes
          .flatMap(n => n.sensors)
          .find(s => s.temperature_supply != null || s.pressure != null);
        if (sensor) {
          const sup  = sensor.temperature_supply  ?? 75;
          const ret  = sensor.temperature_return  ?? 55;
          const pres = sensor.pressure            ?? 0.6;
          setSupplyTemp(+sup.toFixed(1));
          setReturnTemp(+ret.toFixed(1));
          setPressure(+pres.toFixed(2));
          setChartData(generateHistory(sup, ret, pres));
          return;
        }
      } catch {
        // backend unreachable — silently fall through to mock
      }
      setChartData(generateHistory(75, 55, 0.6));
    }
    init();
  }, []);

  useEffect(() => {
    const now = new Date();
    const lbl = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    setChartData(prev =>
      prev.length === 0 ? prev : [...prev.slice(-11), { time: lbl, supplyTemp, returnTemp, pressure }]
    );
    if (pressure < 0.4 || supplyTemp > 95) {
      const msg = pressure < 0.4
        ? `Критическое давление: ${pressure.toFixed(2)} МПа`
        : `Критическая температура подачи: ${supplyTemp}°C`;
      setAlerts(prev => {
        if (prev.some(a => a.severity === 'critical' && a.message === msg)) return prev;
        return [{ id: Date.now(), message: msg, severity: 'critical', time: lbl }, ...prev];
      });
    }
  }, [supplyTemp, returnTemp, pressure]);

  const status = pressure < 0.4 || supplyTemp > 95 ? 'Авария'
    : pressure < 0.5  || supplyTemp > 85 ? 'Предупреждение' : 'Норма';
  const recent = [...chartData].reverse().slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Главная панель</h1>
          <p className="text-sm text-slate-500 mt-0.5">Мониторинг тепловой сети в реальном времени</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full
          ${status === 'Авария' ? 'bg-red-100 text-red-700'
            : status === 'Предупреждение' ? 'bg-amber-100 text-amber-700'
            : 'bg-green-100 text-green-700'}`}>
          {status === 'Авария' ? '⚠ Авария' : status === 'Предупреждение' ? '▲ Предупреждение' : '✓ Норма'}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Температура подачи', value: `${supplyTemp}°C`, icon: Thermometer, warn: supplyTemp > 95, sub: 'Норма: до 95°C' },
          { label: 'Температура обратки', value: `${returnTemp}°C`, icon: Thermometer, warn: false, sub: `Δ = ${(supplyTemp - returnTemp).toFixed(0)}°C` },
          { label: 'Давление сети', value: `${pressure.toFixed(2)} МПа`, icon: Gauge, warn: pressure < 0.4, sub: 'Норма: ≥ 0.40 МПа' },
          { label: 'Активных аварий', value: String(alerts.filter(a => a.severity === 'critical').length), icon: AlertTriangle, warn: alerts.some(a => a.severity === 'critical'), sub: `Предупреждений: ${alerts.filter(a => a.severity === 'warning').length}` },
        ].map(({ label, value, icon: Icon, warn, sub }) => (
          <div key={label} className={`bg-white border rounded-xl p-4 ${warn ? 'border-red-300' : 'border-slate-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 font-medium">{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${warn ? 'bg-red-50' : 'bg-blue-50'}`}>
                <Icon size={15} className={warn ? 'text-red-500' : 'text-blue-600'} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${warn ? 'text-red-600' : 'text-slate-800'}`}>{value}</div>
            <div className={`text-xs mt-1 ${warn ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
              {warn ? '⚠ Превышение порога' : sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-5">
        {/* Left: sliders */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <Activity size={15} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-700">Панель управления узлом</h2>
            </div>
            <div className="p-4 space-y-5">
              {[
                { label: 'Температура подачи', value: supplyTemp, set: setSupplyTemp, min: 60, max: 100, unit: '°C', warn: supplyTemp > 95 },
                { label: 'Температура обратки', value: returnTemp, set: setReturnTemp, min: 40, max: 80, unit: '°C', warn: false },
              ].map(({ label, value, set, min, max, unit, warn }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-600 font-medium">{label}</span>
                    <span className={`font-bold ${warn ? 'text-red-600' : 'text-blue-600'}`}>{value}{unit}</span>
                  </div>
                  <input type="range" min={min} max={max} value={value}
                    onChange={e => set(+e.target.value)}
                    className="w-full accent-blue-600 cursor-pointer" />
                  <div className="flex justify-between text-xs text-slate-300 mt-1">
                    <span>{min}{unit}</span><span>{max}{unit}</span>
                  </div>
                </div>
              ))}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">Давление сети</span>
                  <span className={`font-bold ${pressure < 0.4 ? 'text-red-600' : 'text-blue-600'}`}>{pressure.toFixed(2)} МПа</span>
                </div>
                <input type="range" min={10} max={120} value={Math.round(pressure * 100)}
                  onChange={e => setPressure(+(+e.target.value / 100).toFixed(2))}
                  className="w-full accent-blue-600 cursor-pointer" />
                <div className="flex justify-between text-xs text-slate-300 mt-1">
                  <span>0.10 МПа</span><span>1.20 МПа</span>
                </div>
              </div>
            </div>
          </div>

          {/* Journal */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-700">Журнал параметров</h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-2 text-left text-slate-500 font-medium">Время</th>
                  <th className="px-4 py-2 text-right text-slate-500 font-medium">Тп°C</th>
                  <th className="px-4 py-2 text-right text-slate-500 font-medium">То°C</th>
                  <th className="px-4 py-2 text-right text-slate-500 font-medium">МПа</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} className={`border-b border-slate-50 last:border-0 ${i === 0 ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-2 text-slate-400">{r.time}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${r.supplyTemp > 95 ? 'text-red-600' : 'text-slate-700'}`}>{r.supplyTemp}</td>
                    <td className="px-4 py-2 text-right font-semibold text-slate-700">{r.returnTemp}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${r.pressure < 0.4 ? 'text-red-600' : 'text-slate-700'}`}>{r.pressure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: charts + alerts */}
        <div className="col-span-2 space-y-4">
          {/* Temp chart */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-700">График температур</h2>
              <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5">60 мин</span>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[30, 110]} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="°" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v) => [`${v}°C`]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="supplyTemp" name="Подача" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="returnTemp" name="Обратка" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pressure chart */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-700">График давления</h2>
              <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5">60 мин</span>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 1.4]} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }}
                    formatter={(v) => [typeof v === 'number' ? `${v.toFixed(2)} МПа` : '']}
                  />
                  <Line type="monotone" dataKey="pressure" name="Давление" stroke="#7c3aed" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-700">Аварийные события</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                ${alerts.some(a => a.severity === 'critical') ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                {alerts.length} событий
              </span>
            </div>
            <div className="divide-y divide-slate-50 max-h-44 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-400 text-center">Аварийных событий нет</div>
              ) : alerts.map(a => (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                    ${a.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <AlertTriangle size={13} className={a.severity === 'critical' ? 'text-red-600' : 'text-amber-600'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${a.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                      {a.severity === 'critical' ? 'Авария' : 'Предупреждение'}
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 leading-snug">{a.message}</div>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
