import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  LayoutDashboard, Activity, Database, FileText, Settings, Users,
  Thermometer, Gauge, AlertTriangle, Bell, ChevronDown,
  Radio, Zap,
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
  { icon: LayoutDashboard, label: 'ОБЗОР', id: 'dashboard' },
  { icon: Activity, label: 'МОНИТОРИНГ', id: 'monitoring' },
  { icon: Database, label: 'АРХИВ', id: 'history' },
  { icon: FileText, label: 'ОТЧЁТЫ', id: 'reports' },
  { icon: Settings, label: 'КОНФИГ', id: 'settings' },
  { icon: Users, label: 'ДОСТУП', id: 'users' },
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
  { id: 2, message: 'Плановое ТО — НС-4 завтра 09:00', severity: 'warning', time: '07:30' },
];

export default function DesignIndustrial() {
  const [selectedNode, setSelectedNode] = useState(NODES[0]);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [supplyTemp, setSupplyTemp] = useState(75);
  const [returnTemp, setReturnTemp] = useState(55);
  const [pressure, setPressure] = useState(0.6);
  const [chartData, setChartData] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>(INIT_ALERTS);
  const [nodeOpen, setNodeOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setChartData(generateHistory(75, 55, 0.6));
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const now = new Date();
    const lbl = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChartData(prev =>
      prev.length === 0 ? prev : [...prev.slice(-11), { time: lbl, supplyTemp, returnTemp, pressure }]
    );
    if (pressure < 0.4 || supplyTemp > 95) {
      const msg = pressure < 0.4
        ? `ДАВЛ.НИЗ: ${pressure.toFixed(2)} МПа — ${selectedNode}`
        : `ТЕМП.ВЫС: ${supplyTemp}°C — ${selectedNode}`;
      setAlerts(prev => {
        if (prev.some(a => a.severity === 'critical' && a.message === msg)) return prev;
        return [{ id: Date.now(), message: msg, severity: 'critical', time: lbl }, ...prev];
      });
    }
  }, [supplyTemp, returnTemp, pressure, selectedNode]);

  const status = pressure < 0.4 || supplyTemp > 95 ? 'АВАРИЯ'
    : pressure < 0.5 || supplyTemp > 85 ? 'ПРЕДУПР.' : 'НОРМА';
  const statusColor = status === 'АВАРИЯ' ? '#ef4444' : status === 'ПРЕДУПР.' ? '#f59e0b' : '#22c55e';
  const critCount = alerts.filter(a => a.severity === 'critical').length;
  const recent = [...chartData].reverse().slice(0, 6);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900" style={{ fontFamily: '"Courier New", Consolas, monospace' }}>
      {/* ── Sidebar ── */}
      <aside className="w-52 bg-slate-900 text-white flex flex-col flex-shrink-0 min-h-screen">
        {/* Logo */}
        <div className="px-4 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400 tracking-widest">SCADA-HN</span>
          </div>
          <div className="text-xs text-slate-400">Тепловые сети v2.4.1</div>
        </div>
        {/* Node status */}
        <div className="px-4 py-2 border-b border-slate-700 bg-slate-800">
          <div className="text-xs text-slate-500 mb-1">ТЕКУЩИЙ УЗЕЛ</div>
          <div className="relative">
            <button
              onClick={() => setNodeOpen(o => !o)}
              className="w-full flex items-center justify-between text-xs text-amber-300 hover:text-amber-200"
            >
              <span className="truncate">{selectedNode.split('—')[1]?.trim() ?? selectedNode}</span>
              <ChevronDown size={11} />
            </button>
            {nodeOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-slate-800 border border-slate-600 z-20">
                {NODES.map(n => (
                  <button
                    key={n}
                    onClick={() => { setSelectedNode(n); setNodeOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs border-b border-slate-700 last:border-0
                      ${selectedNode === n ? 'bg-slate-700 text-amber-300' : 'text-slate-300 hover:bg-slate-700'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 py-1">
          {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs text-left transition-colors
                ${activeNav === id ? 'bg-slate-700 text-amber-300 border-l-2 border-amber-400' : 'text-slate-400 hover:bg-slate-800 border-l-2 border-transparent'}`}
            >
              <Icon size={13} />
              <span className="tracking-wider">{label}</span>
            </button>
          ))}
        </nav>
        {/* User */}
        <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-500">
          <div className="text-slate-300 font-mono">АХМЕТОВ А.С.</div>
          <div>ДИСПЕТЧЕР / СМ-1</div>
          <div className="mt-1 text-slate-600">ТАВ: 08:00–20:00</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b-2 border-slate-300 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Status LED */}
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }}
              />
              <span className="font-mono text-sm font-bold" style={{ color: statusColor }}>{status}</span>
            </div>
            <div className="text-xs text-slate-500 font-mono border-l border-slate-200 pl-4">
              СИСТЕМА МОНИТОРИНГА ТЕПЛОВЫХ СЕТЕЙ | {selectedNode.toUpperCase()}
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="flex items-center gap-1.5 text-slate-500">
              <Radio size={12} className="text-green-500" />
              <span>СВЯЗЬ: ОК</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bell size={13} className={critCount > 0 ? 'text-red-500' : 'text-slate-400'} />
              {critCount > 0 && <span className="text-red-600 font-bold">АВА:{critCount}</span>}
            </div>
            <div className="text-slate-700 font-bold tabular-nums" suppressHydrationWarning>{timeStr}</div>
            <div className="text-slate-500">
              {now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 overflow-auto">
          {/* Sensor readouts — top bar */}
          <div className="grid grid-cols-6 gap-2 mb-3">
            {[
              { label: 'ТЕМ.ПОДАЧИ', value: `${supplyTemp.toFixed(1)}`, unit: '°C', warn: supplyTemp > 95, icon: Thermometer },
              { label: 'ТЕМ.ОБРАТКИ', value: `${returnTemp.toFixed(1)}`, unit: '°C', warn: false, icon: Thermometer },
              { label: 'ДЕЛЬТА-Т', value: `${(supplyTemp - returnTemp).toFixed(1)}`, unit: '°C', warn: false, icon: Thermometer },
              { label: 'ДАВЛЕНИЕ', value: `${pressure.toFixed(2)}`, unit: 'МПа', warn: pressure < 0.4, icon: Gauge },
              { label: 'РАСХОД', value: '12.4', unit: 'т/ч', warn: false, icon: Activity },
              { label: 'АВ.СИГН.', value: String(critCount), unit: 'шт', warn: critCount > 0, icon: AlertTriangle },
            ].map(({ label, value, unit, warn, icon: Icon }) => (
              <div
                key={label}
                className={`border-2 p-2.5 text-center ${warn ? 'border-red-500 bg-red-50' : 'border-slate-300 bg-white'}`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon size={11} className={warn ? 'text-red-600' : 'text-slate-500'} />
                  <span className="text-xs text-slate-500 tracking-wider leading-none">{label}</span>
                </div>
                <div className={`font-mono font-bold tabular-nums ${warn ? 'text-red-600 text-xl' : 'text-slate-800 text-xl'}`}>
                  {value}
                </div>
                <div className={`font-mono text-xs ${warn ? 'text-red-500' : 'text-slate-400'}`}>{unit}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Left: controls + table */}
            <div className="space-y-3">
              {/* Sliders */}
              <div className="bg-white border-2 border-slate-300">
                <div className="px-3 py-1.5 bg-slate-200 border-b border-slate-300 flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 tracking-widest">УПРАВЛЕНИЕ</span>
                </div>
                <div className="p-3 space-y-4">
                  {[
                    { label: 'ТЕМ.ПОДАЧИ', value: supplyTemp, set: setSupplyTemp, min: 60, max: 100, unit: '°C', warn: supplyTemp > 95, intVal: true },
                    { label: 'ТЕМ.ОБРАТКИ', value: returnTemp, set: setReturnTemp, min: 40, max: 80, unit: '°C', warn: false, intVal: true },
                  ].map(({ label, value, set, min, max, unit, warn, intVal }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500 tracking-wider">{label}</span>
                        <span className={`font-mono font-bold ${warn ? 'text-red-600' : 'text-slate-800'}`}>{value}{unit}</span>
                      </div>
                      <input
                        type="range" min={min} max={max} value={value}
                        onChange={e => set(intVal ? +e.target.value : +e.target.value)}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-0.5 font-mono">
                        <span>{min}</span><span>{max}{unit}</span>
                      </div>
                    </div>
                  ))}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500 tracking-wider">ДАВЛЕНИЕ</span>
                      <span className={`font-mono font-bold ${pressure < 0.4 ? 'text-red-600' : 'text-slate-800'}`}>
                        {pressure.toFixed(2)} МПа
                      </span>
                    </div>
                    <input
                      type="range" min={10} max={120} value={Math.round(pressure * 100)}
                      onChange={e => setPressure(+(+e.target.value / 100).toFixed(2))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-0.5 font-mono">
                      <span>0.10</span><span>1.20 МПа</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent measurements */}
              <div className="bg-white border-2 border-slate-300">
                <div className="px-3 py-1.5 bg-slate-200 border-b border-slate-300">
                  <span className="text-xs font-bold text-slate-700 tracking-widest">АРХИВ ИЗМЕРЕНИЙ</span>
                </div>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="px-2 py-1 text-left text-slate-600 font-bold">ВРЕМЯ</th>
                      <th className="px-2 py-1 text-right text-slate-600 font-bold">ТП °C</th>
                      <th className="px-2 py-1 text-right text-slate-600 font-bold">ТО °C</th>
                      <th className="px-2 py-1 text-right text-slate-600 font-bold">МПА</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((r, i) => (
                      <tr key={i} className={`border-b border-slate-100 ${i === 0 ? 'bg-amber-50' : ''}`}>
                        <td className="px-2 py-1 text-slate-500">{r.time}</td>
                        <td className={`px-2 py-1 text-right font-bold tabular-nums ${r.supplyTemp > 95 ? 'text-red-600' : ''}`}>
                          {r.supplyTemp.toFixed(1)}
                        </td>
                        <td className="px-2 py-1 text-right font-bold tabular-nums">{r.returnTemp.toFixed(1)}</td>
                        <td className={`px-2 py-1 text-right font-bold tabular-nums ${r.pressure < 0.4 ? 'text-red-600' : ''}`}>
                          {r.pressure.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Active alerts */}
              <div className="bg-white border-2 border-slate-300">
                <div className={`px-3 py-1.5 border-b ${critCount > 0 ? 'bg-red-600 border-red-700' : 'bg-slate-200 border-slate-300'} flex justify-between`}>
                  <span className={`text-xs font-bold tracking-widest ${critCount > 0 ? 'text-white' : 'text-slate-700'}`}>
                    АКТИВНЫЕ АВАРИИ
                  </span>
                  <span className={`text-xs font-mono font-bold ${critCount > 0 ? 'text-red-200' : 'text-slate-500'}`}>
                    [{alerts.length}]
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-slate-400 font-mono">-- НЕТ АКТИВНЫХ АВАРИЙ --</div>
                  ) : alerts.map(a => (
                    <div key={a.id} className={`flex items-start gap-2 px-3 py-1.5 ${a.severity === 'critical' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                      <AlertTriangle size={11} className={`mt-0.5 flex-shrink-0 ${a.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold font-mono ${a.severity === 'critical' ? 'text-red-700' : 'text-yellow-700'}`}>
                          [{a.severity === 'critical' ? 'АВА' : 'ПРД'}] {a.time}
                        </div>
                        <div className="text-xs text-slate-600 font-mono leading-tight mt-0.5">{a.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: charts */}
            <div className="col-span-2 space-y-3">
              {/* Temp chart */}
              <div className="bg-white border-2 border-slate-300">
                <div className="px-3 py-1.5 bg-slate-200 border-b border-slate-300 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 tracking-widest">ТЕМП. КОНТУР (°C)</span>
                  <span className="text-xs text-slate-500 font-mono">ИНТЕРВАЛ: 5 МИН</span>
                </div>
                <div className="p-2">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                      <YAxis domain={[30, 110]} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} unit="°" />
                      <Tooltip
                        contentStyle={{ fontSize: 10, fontFamily: 'monospace', border: '1px solid #94a3b8', borderRadius: 0 }}
                        formatter={(v) => [typeof v === 'number' ? `${v.toFixed(1)}°C` : '']}
                      />
                      <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                      <Line type="stepAfter" dataKey="supplyTemp" name="ПОДАЧА" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                      <Line type="stepAfter" dataKey="returnTemp" name="ОБРАТКА" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pressure chart */}
              <div className="bg-white border-2 border-slate-300">
                <div className="px-3 py-1.5 bg-slate-200 border-b border-slate-300 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 tracking-widest">ДАВЛЕНИЕ СЕТИ (МПа)</span>
                  <span className={`text-xs font-mono font-bold ${pressure < 0.4 ? 'text-red-600 animate-pulse' : 'text-slate-500'}`}>
                    {pressure < 0.4 ? '!! НИЖЕ НОРМЫ !!' : 'НОРМА ≥ 0.40 МПа'}
                  </span>
                </div>
                <div className="p-2">
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                      <YAxis domain={[0, 1.4]} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                      <Tooltip
                        contentStyle={{ fontSize: 10, fontFamily: 'monospace', border: '1px solid #94a3b8', borderRadius: 0 }}
                        formatter={(v) => [typeof v === 'number' ? `${v.toFixed(2)} МПа` : '']}
                      />
                      <Line
                        type="stepAfter" dataKey="pressure" name="ДАВЛ."
                        stroke={pressure < 0.4 ? '#ef4444' : '#f59e0b'}
                        strokeWidth={1.5} dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* System status table */}
              <div className="bg-white border-2 border-slate-300">
                <div className="px-3 py-1.5 bg-slate-200 border-b border-slate-300">
                  <span className="text-xs font-bold text-slate-700 tracking-widest">СОСТОЯНИЕ ОБОРУДОВАНИЯ</span>
                </div>
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="px-3 py-1 text-left text-slate-600 font-bold">ОБЪЕКТ</th>
                      <th className="px-3 py-1 text-center text-slate-600 font-bold">СТАТУС</th>
                      <th className="px-3 py-1 text-right text-slate-600 font-bold">НАГР.%</th>
                      <th className="px-3 py-1 text-right text-slate-600 font-bold">Т ПОСЛЕД.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Насос ЦН-1А', status: 'РАБОТА', load: 78, time: '09:12' },
                      { name: 'Насос ЦН-1Б', status: 'РЕЗЕРВ', load: 0, time: '09:00' },
                      { name: 'Котёл КВ-1', status: 'РАБОТА', load: 85, time: '09:15' },
                      { name: 'Котёл КВ-2', status: pressure < 0.4 || supplyTemp > 95 ? 'АВАРИЯ' : 'РАБОТА', load: pressure < 0.4 || supplyTemp > 95 ? 0 : 62, time: '09:14' },
                      { name: 'Теплообм. Т-1', status: 'РАБОТА', load: 91, time: '09:13' },
                    ].map(row => (
                      <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-3 py-1.5 text-slate-700">{row.name}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 text-xs font-bold
                            ${row.status === 'АВАРИЯ' ? 'bg-red-100 text-red-700'
                              : row.status === 'РАБОТА' ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">{row.load}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
