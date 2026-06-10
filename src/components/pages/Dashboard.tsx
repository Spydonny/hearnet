import { useState, useEffect, useId } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Thermometer, Gauge, AlertTriangle, Activity } from 'lucide-react';

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

// ── Slider component ──────────────────────────────────────────────────────

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  warn?: boolean;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
}

function Slider({ label, value, min, max, step, unit, warn, onChange, formatValue }: SliderProps) {
  const id = useId();
  const pct = ((value - min) / (max - min)) * 100;
  const display = formatValue ? formatValue(value) : String(value);
  const minLbl = formatValue ? formatValue(min) : String(min);
  const maxLbl = formatValue ? formatValue(max) : String(max);

  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <label htmlFor={id} className="text-slate-600 dark:text-slate-300 font-medium">{label}</label>
        <span className={`font-bold ${warn ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>{display}{unit}</span>
      </div>
      <div className="relative h-6 flex items-center">
        {/* track bg */}
        <div className="absolute inset-x-0 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
        {/* track fill */}
        <div
          className={`absolute left-0 h-1.5 rounded-full transition-colors ${warn ? 'bg-red-500' : 'bg-blue-500 dark:bg-blue-400'}`}
          style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        />
        {/* hidden input */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(+e.target.value)}
          className={`slider-track ${warn ? 'warn-thumb' : ''}`}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 mt-1">
        <span>{minLbl}{unit}</span>
        <span>{maxLbl}{unit}</span>
      </div>
    </div>
  );
}

const INIT_ALERTS: AlertItem[] = [
  { id: 1, message: 'Повышенный расход теплоносителя — ЦТП-2', severity: 'warning', time: '08:45' },
  { id: 2, message: 'Плановое ТО насосной станции НС-4 — завтра 09:00', severity: 'warning', time: '07:30' },
];

export default function Dashboard() {
  const [supplyTemp, setSupplyTemp]   = useState(75);
  const [returnTemp, setReturnTemp]   = useState(55);
  const [pressure,   setPressure]     = useState(0.6);
  const [chartData,  setChartData]    = useState<Reading[]>(() => generateHistory(75, 55, 0.6));
  const [alerts,     setAlerts]       = useState<AlertItem[]>(INIT_ALERTS);

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
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">Главная панель</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Мониторинг тепловой сети в реальном времени</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full
          ${status === 'Авария' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
            : status === 'Предупреждение' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
            : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'}`}>
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
          <div key={label} className={`bg-white dark:bg-slate-800 border rounded-xl p-4 transition-colors ${warn ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${warn ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                <Icon size={15} className={warn ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${warn ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>{value}</div>
            <div className={`text-xs mt-1 ${warn ? 'text-red-500 dark:text-red-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
              {warn ? '⚠ Превышение порога' : sub}
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-3 gap-5">
        {/* Left: sliders + journal */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <Activity size={15} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Панель управления узлом</h2>
            </div>
            <div className="p-4 space-y-5">
              <Slider
                label="Температура подачи"
                value={supplyTemp} min={60} max={100} step={1} unit="°C"
                warn={supplyTemp > 95}
                onChange={setSupplyTemp}
              />
              <Slider
                label="Температура обратки"
                value={returnTemp} min={40} max={80} step={1} unit="°C"
                warn={false}
                onChange={setReturnTemp}
              />
              <Slider
                label="Давление сети"
                value={pressure} min={0.10} max={1.20} step={0.01} unit="МПа"
                warn={pressure < 0.4}
                onChange={setPressure}
                formatValue={v => v.toFixed(2)}
              />
            </div>
          </div>

          {/* Journal */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Журнал параметров</h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-2 text-left text-slate-500 dark:text-slate-400 font-medium">Время</th>
                  <th className="px-4 py-2 text-right text-slate-500 dark:text-slate-400 font-medium">Тп°C</th>
                  <th className="px-4 py-2 text-right text-slate-500 dark:text-slate-400 font-medium">То°C</th>
                  <th className="px-4 py-2 text-right text-slate-500 dark:text-slate-400 font-medium">МПа</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r, i) => (
                  <tr key={i} className={`border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${i === 0 ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                    <td className="px-4 py-2 text-slate-400 dark:text-slate-500">{r.time}</td>
                    <td className={`px-4 py-2 text-right font-semibold tabular-nums ${r.supplyTemp > 95 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{r.supplyTemp}</td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-200">{r.returnTemp}</td>
                    <td className={`px-4 py-2 text-right font-semibold tabular-nums ${r.pressure < 0.4 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{r.pressure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: charts + alerts */}
        <div className="col-span-2 space-y-4">
          {/* Temp chart */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">График температур</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-0.5">60 мин</span>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[30, 110]} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="°" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #334155', background: '#1e293b' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(v: any) => [v != null ? `${v}°C` : '—']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#cbd5e1' }} />
                  <Line type="monotone" dataKey="supplyTemp" name="Подача" stroke="#2563eb" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="returnTemp" name="Обратка" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pressure chart */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">График давления</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-0.5">60 мин</span>
            </div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 1.4]} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #334155', background: '#1e293b' }}
                    itemStyle={{ color: '#e2e8f0' }}
                    formatter={(v: any) => [v != null ? `${Number(v).toFixed(2)} МПа` : '—']}
                  />
                  <Line type="monotone" dataKey="pressure" name="Давление" stroke="#7c3aed" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Аварийные события</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                ${alerts.some(a => a.severity === 'critical') ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                {alerts.length} событий
              </span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50 max-h-44 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-400 dark:text-slate-500 text-center">Аварийных событий нет</div>
              ) : alerts.map(a => (
                <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                    ${a.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                    <AlertTriangle size={13} className={a.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold ${a.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {a.severity === 'critical' ? 'Авария' : 'Предупреждение'}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">{a.message}</div>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
