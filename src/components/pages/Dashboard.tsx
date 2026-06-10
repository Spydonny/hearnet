import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Thermometer, Gauge, AlertTriangle, Activity, Loader2 } from 'lucide-react';
import { apiGet } from '../../utils/api';
import type { CurrentResponse, ApiAlert } from '../../utils/api';

interface Reading { time: string; supplyTemp: number | null; returnTemp: number | null; pressure: number | null; heatLoad: number | null; }

function formatTime(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function Dashboard() {
  const [nodes, setNodes] = useState<CurrentResponse['nodes']>([]);
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [chartHistory, setChartHistory] = useState<Reading[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const supplyTemp = nodes
    .flatMap(n => n.sensors)
    .find(s => s.temperature_supply != null)?.temperature_supply ?? null;

  const returnTemp = nodes
    .flatMap(n => n.sensors)
    .find(s => s.temperature_return != null)?.temperature_return ?? null;

  const pressure = nodes
    .flatMap(n => n.sensors)
    .find(s => s.pressure != null)?.pressure ?? null;

  const allSensors = nodes.flatMap(n => n.sensors);
  const criticalCount = allSensors.filter(s => {
    if (s.pressure != null && s.pressure < 0.4) return true;
    if (s.temperature_supply != null && s.temperature_supply > 95) return true;
    return false;
  }).length;

  const status = criticalCount > 0 ? 'Авария'
    : (supplyTemp != null && supplyTemp > 85) || (pressure != null && pressure < 0.5) ? 'Предупреждение' : 'Норма';

  const fetchData = useCallback(async () => {
    try {
      const data = await apiGet<CurrentResponse>('/api/current');
      setNodes(data.nodes);
      setError('');

      const sensor = data.nodes
        .flatMap(n => n.sensors)
        .find(s => s.temperature_supply != null || s.pressure != null);

      if (sensor) {
        const now = formatTime(new Date());
        setChartHistory(prev => {
          const newPoint: Reading = {
            time: now,
            supplyTemp: sensor.temperature_supply,
            returnTemp: sensor.temperature_return,
            pressure: sensor.pressure,
            heatLoad: sensor.heat_load,
          };
          return [...prev.slice(-59), newPoint];
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    async function loadAlerts() {
      try {
        const data = await apiGet<{ alerts?: ApiAlert[]; items?: ApiAlert[] }>('/alerts?status=active&page=1');
        if (cancelled) return;
        setAlerts((data.alerts ?? data.items ?? []).slice(0, 50));
      } catch { /* ignore */ }
    }
    loadAlerts();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">Загрузка данных...</span>
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertTriangle size={32} className="text-red-400 mb-3" />
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">Не удалось загрузить данные</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{error}</p>
        <button onClick={fetchData} className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">Повторить</button>
      </div>
    );
  }

  const sensorCount = allSensors.length;
  const nodeCount = nodes.length;

  return (
    <div className="space-y-5">
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

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Температура подачи', value: supplyTemp != null ? `${supplyTemp.toFixed(1)}°C` : '—', icon: Thermometer, warn: supplyTemp != null && supplyTemp > 95, sub: supplyTemp != null ? (supplyTemp > 95 ? '⚠ Превышение порога' : `Норма: до 95°C`) : 'Нет данных' },
          { label: 'Температура обратки', value: returnTemp != null ? `${returnTemp.toFixed(1)}°C` : '—', icon: Thermometer, warn: false, sub: supplyTemp != null && returnTemp != null ? `Δ = ${(supplyTemp - returnTemp).toFixed(0)}°C` : 'Нет данных' },
          { label: 'Давление сети', value: pressure != null ? `${pressure.toFixed(2)} МПа` : '—', icon: Gauge, warn: pressure != null && pressure < 0.4, sub: pressure != null ? (pressure < 0.4 ? '⚠ Критическое давление' : 'Норма: ≥ 0.40 МПа') : 'Нет данных' },
          { label: 'Активных датчиков', value: String(sensorCount), icon: Activity, warn: false, sub: `Узлов: ${nodeCount}` },
        ].map(({ label, value, icon: Icon, warn, sub }) => (
          <div key={label} className={`bg-white dark:bg-slate-800 border rounded-xl p-4 transition-colors ${warn ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${warn ? 'bg-red-50 dark:bg-red-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                <Icon size={15} className={warn ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${warn ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>{value}</div>
            <div className={`text-xs mt-1 ${warn ? 'text-red-500 dark:text-red-400 font-medium' : 'text-slate-400 dark:text-slate-500'}`}>{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <Activity size={15} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Узлы теплосети</h2>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {nodes.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-slate-400 dark:text-slate-500">Нет данных об узлах</div>
              ) : nodes.map(n => (
                <div key={n.node_id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{n.node_name}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{n.sensors.length} датч.</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {n.sensors.slice(0, 3).map(s => (
                      <span key={s.sensor_id} className={`text-xs px-1.5 py-0.5 rounded-md
                        ${s.temperature_supply != null && s.temperature_supply > 95 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                          : s.pressure != null && s.pressure < 0.4 ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {s.sensor_name}
                        {s.temperature_supply != null ? ` ${s.temperature_supply.toFixed(1)}°C` : ''}
                      </span>
                    ))}
                    {n.sensors.length > 3 && <span className="text-xs text-slate-400 dark:text-slate-500">+{n.sensors.length - 3}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Последние показания</h2>
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
                {chartHistory.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-4 text-center text-slate-400 dark:text-slate-500">Ожидание данных...</td></tr>
                ) : [...chartHistory].reverse().slice(0, 10).map((r, i) => (
                  <tr key={i} className={`border-b border-slate-50 dark:border-slate-700/50 last:border-0 ${i === 0 ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                    <td className="px-4 py-2 text-slate-400 dark:text-slate-500">{r.time}</td>
                    <td className={`px-4 py-2 text-right font-semibold tabular-nums ${r.supplyTemp != null && r.supplyTemp > 95 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {r.supplyTemp != null ? r.supplyTemp.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                      {r.returnTemp != null ? r.returnTemp.toFixed(1) : '—'}
                    </td>
                    <td className={`px-4 py-2 text-right font-semibold tabular-nums ${r.pressure != null && r.pressure < 0.4 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {r.pressure != null ? r.pressure.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column — charts + alerts */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">График температур</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-0.5">~1 мин</span>
            </div>
            <div className="p-4">
              {chartHistory.length === 0 ? (
                <div className="flex items-center justify-center h-[190px] text-sm text-slate-400 dark:text-slate-500">Ожидание данных...</div>
              ) : (
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={chartHistory} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="°" axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #334155', background: '#1e293b' }}
                      itemStyle={{ color: '#e2e8f0' }}
                      formatter={(v, name) => {
                        if (name === 'Подача' || name === 'Обратка') return [v != null ? `${Number(v).toFixed(1)}°C` : '—'];
                        return [v != null ? `${Number(v).toFixed(1)}` : '—'];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#cbd5e1' }} />
                    <Line type="monotone" dataKey="supplyTemp" name="Подача" stroke="#3b82f6" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="returnTemp" name="Обратка" stroke="#0ea5e9" strokeWidth={2} dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Давление</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-0.5">~1 мин</span>
              </div>
              <div className="p-4">
                {chartHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-[130px] text-sm text-slate-400 dark:text-slate-500">Ожидание данных...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={chartHistory} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tickFormatter={(v: number) => v.toFixed(1)} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #334155', background: '#1e293b' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(v) => [v != null ? `${Number(v).toFixed(2)} МПа` : '—']}
                      />
                      <Line type="monotone" dataKey="pressure" name="Давление" stroke="#7c3aed" strokeWidth={2} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Тепловая нагрузка</h2>
                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-0.5">~1 мин</span>
              </div>
              <div className="p-4">
                {chartHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-[130px] text-sm text-slate-400 dark:text-slate-500">Ожидание данных...</div>
                ) : (
                  <ResponsiveContainer width="100%" height={130}>
                    <LineChart data={chartHistory} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="Гкал" axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #334155', background: '#1e293b' }}
                        itemStyle={{ color: '#e2e8f0' }}
                        formatter={(v) => [v != null ? `${Number(v).toFixed(2)} Гкал/ч` : '—']}
                      />
                      <Line type="monotone" dataKey="heatLoad" name="Нагрузка" stroke="#10b981" strokeWidth={2} dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Аварийные события</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                ${alerts.some(a => a.alert_level === 'critical' || a.alert_level === 'emergency')
                  ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                {alerts.length} событий
              </span>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700/50 max-h-44 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-400 dark:text-slate-500 text-center">Аварийных событий нет</div>
              ) : alerts.map(a => {
                const isCritical = a.alert_level === 'critical' || a.alert_level === 'emergency';
                const time = a.created_at ? new Date(a.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <div key={a.alert_id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                      ${isCritical ? 'bg-red-100 dark:bg-red-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                      <AlertTriangle size={13} className={isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {isCritical ? 'Авария' : 'Предупреждение'}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">{a.message}</div>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">{time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
