import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard, Activity, Database, FileText, Settings, Users,
  Thermometer, Gauge, AlertTriangle, Bell, ChevronDown, Building2,
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
  { icon: LayoutDashboard, label: 'Главная панель', id: 'dashboard' },
  { icon: Activity, label: 'Мониторинг узлов', id: 'monitoring' },
  { icon: Database, label: 'История данных', id: 'history' },
  { icon: FileText, label: 'Отчёты', id: 'reports' },
  { icon: Settings, label: 'Настройки системы', id: 'settings' },
  { icon: Users, label: 'Пользователи', id: 'users' },
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
  { id: 1, message: 'Повышенный расход теплоносителя — ЦТП-2', severity: 'warning', time: '08:45' },
  { id: 2, message: 'Плановое техобслуживание НС-4 завтра в 09:00', severity: 'warning', time: '07:30' },
];

export default function DesignEGov() {
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
  const statusCls = status === 'Авария' ? 'bg-red-600 text-white'
    : status === 'Предупреждение' ? 'bg-yellow-500 text-white' : 'bg-green-700 text-white';
  const critCount = alerts.filter(a => a.severity === 'critical').length;
  const recent = [...chartData].reverse().slice(0, 5);

  return (
    <div className="flex min-h-screen bg-white text-slate-800" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Sidebar ── */}
      <aside className="w-64 bg-blue-700 text-white flex flex-col flex-shrink-0 min-h-screen">
        <div className="px-5 py-4 border-b border-blue-800">
          <div className="text-xs font-semibold text-blue-200 uppercase tracking-widest mb-1">Республика Казахстан</div>
          <div className="text-sm font-bold leading-snug">Система мониторинга тепловых сетей</div>
          <div className="text-xs text-blue-300 mt-0.5">SCADA v2.4.1 — ГКП «Тепло»</div>
        </div>
        <nav className="flex-1 py-1">
          {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors
                ${activeNav === id
                  ? 'bg-blue-800 border-l-4 border-white font-semibold'
                  : 'border-l-4 border-transparent hover:bg-blue-600'}`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="px-5 py-3 border-t border-blue-800 text-xs text-blue-300">
          <div className="font-medium text-white text-sm">Ахметов А. С.</div>
          <div>Диспетчер 1-й категории</div>
          <div className="mt-1 text-blue-400">Смена: 08:00 – 20:00</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-300 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-blue-700 uppercase tracking-wide">
              Главная панель мониторинга тепловой сети
            </h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-sm ${statusCls}`}>
              {status === 'Авария' ? '⚠ АВАРИЯ' : status === 'Предупреждение' ? '▲ ПРЕДУПРЕЖДЕНИЕ' : '✓ НОРМА'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {/* Node selector */}
            <div className="relative">
              <button
                onClick={() => setNodeOpen(o => !o)}
                className="flex items-center gap-2 border border-slate-300 rounded-sm px-3 py-1.5 text-xs bg-white hover:bg-slate-50"
              >
                <Building2 size={13} className="text-blue-600" />
                <span className="font-medium">{selectedNode}</span>
                <ChevronDown size={12} />
              </button>
              {nodeOpen && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-slate-300 shadow-md z-20 rounded-sm">
                  {NODES.map(n => (
                    <button
                      key={n}
                      onClick={() => { setSelectedNode(n); setNodeOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-blue-50
                        ${selectedNode === n ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Bell */}
            <div className="relative flex items-center">
              <Bell size={15} className="text-slate-500" />
              {critCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-xs w-4 h-4 rounded-sm flex items-center justify-center font-bold text-[10px]">
                  {critCount}
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 border-l border-slate-200 pl-4">
              {new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 bg-slate-50 overflow-auto">
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              {
                label: 'Температура подачи', value: `${supplyTemp}°C`,
                icon: Thermometer, warn: supplyTemp > 95,
                sub: `Норма: до 95°C`,
              },
              {
                label: 'Температура обратки', value: `${returnTemp}°C`,
                icon: Thermometer, warn: false,
                sub: `Δ = ${(supplyTemp - returnTemp).toFixed(0)}°C`,
              },
              {
                label: 'Давление сети', value: `${pressure.toFixed(2)} МПа`,
                icon: Gauge, warn: pressure < 0.4,
                sub: `Норма: ≥ 0.40 МПа`,
              },
              {
                label: 'Активных аварий', value: String(critCount),
                icon: AlertTriangle, warn: critCount > 0,
                sub: `Предупреждений: ${alerts.filter(a => a.severity === 'warning').length}`,
              },
            ].map(({ label, value, icon: Icon, warn, sub }) => (
              <div
                key={label}
                className={`bg-white border rounded-sm p-4 ${warn ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">{label}</span>
                  <Icon size={16} className={warn ? 'text-red-600' : 'text-blue-600'} />
                </div>
                <div className={`text-2xl font-bold ${warn ? 'text-red-600' : 'text-blue-700'}`}>{value}</div>
                <div className={`text-xs mt-1 ${warn ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                  {warn ? '⚠ Превышение порога!' : sub}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-5">
            {/* Left column */}
            <div className="space-y-4">
              {/* Sliders */}
              <div className="bg-white border border-slate-300 rounded-sm">
                <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100">
                  <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Управление параметрами</h2>
                </div>
                <div className="p-4 space-y-5">
                  {[
                    { label: 'Температура подачи', value: supplyTemp, set: setSupplyTemp, min: 60, max: 100, unit: '°C', warn: supplyTemp > 95, toInt: true },
                    { label: 'Температура обратки', value: returnTemp, set: setReturnTemp, min: 40, max: 80, unit: '°C', warn: false, toInt: true },
                  ].map(({ label, value, set, min, max, unit, warn, toInt }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{label}</span>
                        <span className={`font-bold ${warn ? 'text-red-600' : 'text-blue-700'}`}>{value}{unit}</span>
                      </div>
                      <input
                        type="range" min={min} max={max} value={value}
                        onChange={e => set(toInt ? +e.target.value : +e.target.value)}
                        className="w-full accent-blue-600 cursor-pointer h-1"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                        <span>{min}{unit}</span><span>{max}{unit}</span>
                      </div>
                    </div>
                  ))}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600">Давление сети</span>
                      <span className={`font-bold ${pressure < 0.4 ? 'text-red-600' : 'text-blue-700'}`}>
                        {pressure.toFixed(2)} МПа
                      </span>
                    </div>
                    <input
                      type="range" min={10} max={120} value={Math.round(pressure * 100)}
                      onChange={e => setPressure(+(+e.target.value / 100).toFixed(2))}
                      className="w-full accent-blue-600 cursor-pointer h-1"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-0.5">
                      <span>0.10 МПа</span><span>1.20 МПа</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Measurements */}
              <div className="bg-white border border-slate-300 rounded-sm">
                <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100">
                  <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Последние измерения</h2>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2 text-left text-slate-500 font-semibold">Время</th>
                      <th className="px-3 py-2 text-right text-slate-500 font-semibold">Тп,°C</th>
                      <th className="px-3 py-2 text-right text-slate-500 font-semibold">То,°C</th>
                      <th className="px-3 py-2 text-right text-slate-500 font-semibold">МПа</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${i === 0 ? 'bg-blue-50 font-semibold' : ''}`}>
                        <td className="px-3 py-1.5 text-slate-500">{r.time}</td>
                        <td className={`px-3 py-1.5 text-right ${r.supplyTemp > 95 ? 'text-red-600 font-bold' : ''}`}>{r.supplyTemp}</td>
                        <td className="px-3 py-1.5 text-right">{r.returnTemp}</td>
                        <td className={`px-3 py-1.5 text-right ${r.pressure < 0.4 ? 'text-red-600 font-bold' : ''}`}>{r.pressure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="col-span-2 space-y-4">
              {/* Temp chart */}
              <div className="bg-white border border-slate-300 rounded-sm">
                <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide">График температур</h2>
                  <span className="text-xs text-slate-400">Последние 60 мин</span>
                </div>
                <div className="p-3">
                  <ResponsiveContainer width="100%" height={190}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis domain={[30, 110]} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="°" />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 0, border: '1px solid #cbd5e1' }}
                        formatter={(v) => [`${v}°C`]}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="supplyTemp" name="Подача" stroke="#1d4ed8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="returnTemp" name="Обратка" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pressure chart */}
              <div className="bg-white border border-slate-300 rounded-sm">
                <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide">График давления</h2>
                  <span className="text-xs text-slate-400">Последние 60 мин</span>
                </div>
                <div className="p-3">
                  <ResponsiveContainer width="100%" height={140}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis domain={[0, 1.4]} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 0, border: '1px solid #cbd5e1' }}
                        formatter={(v) => [typeof v === 'number' ? `${v.toFixed(2)} МПа` : '']}
                      />
                      <Line type="monotone" dataKey="pressure" name="Давление" stroke="#7c3aed" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-white border border-slate-300 rounded-sm">
                <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-100 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wide">Активные сигнализации</h2>
                  <span className="text-xs text-slate-400">{alerts.length} записей</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-slate-400 text-center">Активных аварий нет</div>
                  ) : alerts.map(a => (
                    <div key={a.id} className={`flex items-start gap-3 px-4 py-2.5 ${a.severity === 'critical' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                      <AlertTriangle size={13} className={`mt-0.5 flex-shrink-0 ${a.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold uppercase ${a.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'}`}>
                          {a.severity === 'critical' ? 'Авария' : 'Предупреждение'}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5 leading-tight">{a.message}</div>
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{a.time}</span>
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
