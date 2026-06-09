import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard, Activity, Database, FileText, Settings, Users,
  Thermometer, Gauge, AlertTriangle, Bell, ChevronDown, Flame,
  TrendingUp, TrendingDown, Minus,
} from 'lucide-react';

interface SensorReading {
  time: string;
  supplyTemp: number;
  returnTemp: number;
  pressure: number;
}

interface AlertItem {
  id: number;
  message: string;
  severity: 'critical' | 'warning';
  time: string;
}

const NODES = [
  'Котельная — ЦТП-1',
  'Котельная — ЦТП-2',
  'Котельная — ЦТП-3',
  'Насосная станция — НС-4',
  'Тепловой узел — ТУ-5',
];

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Панель управления', id: 'dashboard' },
  { icon: Activity, label: 'Мониторинг', id: 'monitoring' },
  { icon: Database, label: 'История', id: 'history' },
  { icon: FileText, label: 'Отчёты', id: 'reports' },
  { icon: Settings, label: 'Настройки', id: 'settings' },
  { icon: Users, label: 'Команда', id: 'users' },
];

function generateHistory(sup: number, ret: number, pres: number): SensorReading[] {
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
  { id: 1, message: 'Повышенный расход теплоносителя на ЦТП-2', severity: 'warning', time: '08:45' },
  { id: 2, message: 'Плановое ТО насосной станции НС-4 — завтра в 09:00', severity: 'warning', time: '07:30' },
];

export default function DesignModern() {
  const [selectedNode, setSelectedNode] = useState(NODES[0]);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [supplyTemp, setSupplyTemp] = useState(75);
  const [returnTemp, setReturnTemp] = useState(55);
  const [pressure, setPressure] = useState(0.6);
  const [chartData, setChartData] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>(INIT_ALERTS);
  const [nodeOpen, setNodeOpen] = useState(false);

  useEffect(() => {
    setChartData(generateHistory(75, 55, 0.6));
  }, []);

  useEffect(() => {
    const now = new Date();
    const lbl = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChartData(prev =>
      prev.length === 0 ? prev : [...prev.slice(-11), { time: lbl, supplyTemp, returnTemp, pressure }]
    );
    if (pressure < 0.4 || supplyTemp > 95) {
      const msg = pressure < 0.4
        ? `Критическое давление: ${pressure.toFixed(2)} МПа — ${selectedNode}`
        : `Критическая температура подачи: ${supplyTemp}°C — ${selectedNode}`;
      setAlerts(prev => {
        if (prev.some(a => a.severity === 'critical' && a.message === msg)) return prev;
        return [{ id: Date.now(), message: msg, severity: 'critical', time: lbl }, ...prev];
      });
    }
  }, [supplyTemp, returnTemp, pressure, selectedNode]);

  const status = pressure < 0.4 || supplyTemp > 95 ? 'Авария'
    : pressure < 0.5 || supplyTemp > 85 ? 'Предупреждение' : 'Норма';
  const critCount = alerts.filter(a => a.severity === 'critical').length;
  const recent = [...chartData].reverse().slice(0, 5);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-white shadow-md flex flex-col flex-shrink-0 min-h-screen">
        <div className="px-5 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
              <Flame size={16} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 leading-none">HeatNet</div>
              <div className="text-xs text-slate-400 mt-0.5">SCADA Monitor</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all
                ${activeNav === id
                  ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="mx-3 mb-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="text-xs font-semibold text-slate-700">Ахметов А. С.</div>
          <div className="text-xs text-slate-400">Диспетчер • Смена до 20:00</div>
          <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full">
            <div className="h-1.5 bg-emerald-400 rounded-full" style={{ width: '60%' }} />
          </div>
          <div className="text-xs text-slate-400 mt-1">Смена: 60% выполнено</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-800">Панель мониторинга</h1>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full
              ${status === 'Авария' ? 'bg-red-100 text-red-700'
                : status === 'Предупреждение' ? 'bg-amber-100 text-amber-700'
                : 'bg-emerald-100 text-emerald-700'}`}>
              {status === 'Авария' ? '⚠ Авария' : status === 'Предупреждение' ? '▲ Предупреждение' : '✓ Норма'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* Node selector */}
            <div className="relative">
              <button
                onClick={() => setNodeOpen(o => !o)}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 text-sm hover:bg-slate-100 transition-colors shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-medium text-slate-700">{selectedNode}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              {nodeOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-lg border border-slate-100 z-20 overflow-hidden py-1">
                  {NODES.map(n => (
                    <button
                      key={n}
                      onClick={() => { setSelectedNode(n); setNodeOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                        ${selectedNode === n ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Bell */}
            <div className="relative">
              <button className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
                <Bell size={16} className="text-slate-500" />
              </button>
              {critCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px]">
                  {critCount}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 overflow-auto">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {[
              {
                label: 'Температура подачи', value: `${supplyTemp}°C`,
                icon: Thermometer, color: supplyTemp > 95 ? 'text-red-500' : 'text-emerald-600',
                bg: supplyTemp > 95 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100',
                trend: supplyTemp > 85 ? <TrendingUp size={14} className="text-red-400" /> : <Minus size={14} className="text-slate-300" />,
                sub: supplyTemp > 95 ? 'Превышение порога' : 'В норме',
                subColor: supplyTemp > 95 ? 'text-red-500' : 'text-emerald-500',
              },
              {
                label: 'Температура обратки', value: `${returnTemp}°C`,
                icon: Thermometer, color: 'text-sky-600',
                bg: 'bg-white border-slate-100',
                trend: <TrendingDown size={14} className="text-sky-400" />,
                sub: `Δ = ${(supplyTemp - returnTemp).toFixed(0)}°C`,
                subColor: 'text-slate-400',
              },
              {
                label: 'Давление сети', value: `${pressure.toFixed(2)} МПа`,
                icon: Gauge, color: pressure < 0.4 ? 'text-red-500' : 'text-violet-600',
                bg: pressure < 0.4 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100',
                trend: pressure < 0.4 ? <TrendingDown size={14} className="text-red-400" /> : <Minus size={14} className="text-slate-300" />,
                sub: pressure < 0.4 ? 'Критически низкое' : 'В норме',
                subColor: pressure < 0.4 ? 'text-red-500' : 'text-emerald-500',
              },
              {
                label: 'Активных аварий', value: String(critCount),
                icon: AlertTriangle, color: critCount > 0 ? 'text-red-500' : 'text-emerald-600',
                bg: critCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100',
                trend: null,
                sub: `Предупреждений: ${alerts.filter(a => a.severity === 'warning').length}`,
                subColor: 'text-slate-400',
              },
            ].map(({ label, value, icon: Icon, color, bg, trend, sub, subColor }) => (
              <div key={label} className={`${bg} border rounded-2xl p-4 shadow-sm`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-100`}>
                    <Icon size={16} className={color} />
                  </div>
                  {trend}
                </div>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-slate-400 mt-0.5 font-medium">{label}</div>
                <div className={`text-xs mt-1.5 font-medium ${subColor}`}>{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Left column */}
            <div className="space-y-4">
              {/* Sliders */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-4">
                <h2 className="text-sm font-bold text-slate-700 mb-4">Управление параметрами</h2>
                <div className="space-y-5">
                  {[
                    { label: 'Темп. подачи', value: supplyTemp, set: setSupplyTemp, min: 60, max: 100, unit: '°C', warn: supplyTemp > 95, intVal: true },
                    { label: 'Темп. обратки', value: returnTemp, set: setReturnTemp, min: 40, max: 80, unit: '°C', warn: false, intVal: true },
                  ].map(({ label, value, set, min, max, unit, warn, intVal }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500 font-medium">{label}</span>
                        <span className={`font-bold ${warn ? 'text-red-500' : 'text-emerald-600'}`}>{value}{unit}</span>
                      </div>
                      <input
                        type="range" min={min} max={max} value={value}
                        onChange={e => set(intVal ? +e.target.value : +e.target.value)}
                        className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-full"
                      />
                      <div className="flex justify-between text-xs text-slate-300 mt-1">
                        <span>{min}{unit}</span><span>{max}{unit}</span>
                      </div>
                    </div>
                  ))}
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-500 font-medium">Давление</span>
                      <span className={`font-bold ${pressure < 0.4 ? 'text-red-500' : 'text-emerald-600'}`}>
                        {pressure.toFixed(2)} МПа
                      </span>
                    </div>
                    <input
                      type="range" min={10} max={120} value={Math.round(pressure * 100)}
                      onChange={e => setPressure(+(+e.target.value / 100).toFixed(2))}
                      className="w-full accent-emerald-500 cursor-pointer h-1.5 rounded-full"
                    />
                    <div className="flex justify-between text-xs text-slate-300 mt-1">
                      <span>0.10 МПа</span><span>1.20 МПа</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent table */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-700">Последние измерения</h2>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-50">
                      <th className="px-4 py-2 text-left text-slate-400 font-medium">Время</th>
                      <th className="px-4 py-2 text-right text-slate-400 font-medium">Тп</th>
                      <th className="px-4 py-2 text-right text-slate-400 font-medium">То</th>
                      <th className="px-4 py-2 text-right text-slate-400 font-medium">МПа</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r, i) => (
                      <tr key={i} className={`border-b border-slate-50 last:border-0 ${i === 0 ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                        <td className="px-4 py-2 text-slate-400 font-medium">{r.time}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${r.supplyTemp > 95 ? 'text-red-500' : 'text-slate-700'}`}>{r.supplyTemp}</td>
                        <td className="px-4 py-2 text-right font-semibold text-slate-700">{r.returnTemp}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${r.pressure < 0.4 ? 'text-red-500' : 'text-slate-700'}`}>{r.pressure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="col-span-2 space-y-4">
              {/* Temp chart */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold text-slate-700">График температур</h2>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">Последние 60 мин</span>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[30, 110]} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="°" axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                      formatter={(v) => [`${v}°C`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="supplyTemp" name="Подача" stroke="#10b981" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="returnTemp" name="Обратка" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pressure chart */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-md p-4">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-bold text-slate-700">График давления</h2>
                  <span className="text-xs text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">Последние 60 мин</span>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 1.4]} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                      formatter={(v) => [typeof v === 'number' ? `${v.toFixed(2)} МПа` : '']}
                    />
                    <Line type="monotone" dataKey="pressure" name="Давление" stroke="#8b5cf6" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Alerts */}
              <div className="bg-white border border-slate-100 rounded-2xl shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-slate-700">Активные сигнализации</h2>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full
                    ${critCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                    {alerts.length} событий
                  </span>
                </div>
                <div className="divide-y divide-slate-50 max-h-44 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-4 text-xs text-slate-400 text-center">Активных аварий нет</div>
                  ) : alerts.map(a => (
                    <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
                        ${a.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'}`}>
                        <AlertTriangle size={13} className={a.severity === 'critical' ? 'text-red-600' : 'text-amber-600'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold ${a.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}>
                          {a.severity === 'critical' ? 'Авария' : 'Предупреждение'}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 leading-tight">{a.message}</div>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
