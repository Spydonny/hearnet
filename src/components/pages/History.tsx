import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, AlertTriangle, Activity, ChevronDown, Loader2 } from 'lucide-react';
import { apiGet } from '../../utils/api';
import type { ApiMeasurement } from '../../utils/api';

interface ArchiveRow {
  id: number;
  datetime: string;
  node: string;
  sensor: string;
  type: 'Измерение' | 'Авария';
  supplyTemp: number | null;
  returnTemp: number | null;
  pressure: number | null;
  flowRate: number | null;
  heatLoad: number | null;
}

function defaultDateFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().slice(0, 10);
}
function defaultDateTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function History() {
  const [rows, setRows] = useState<ArchiveRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('Все');
  const [nodeFilter, setNodeFilter] = useState('Все');
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchArchive = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({ page: String(page) });
      if (dateFrom) query.set('date_from', dateFrom);
      if (dateTo) query.set('date_to', dateTo);

      const data = await apiGet<{
        measurements?: ApiMeasurement[];
        items?: ApiMeasurement[];
        page?: number;
        total_pages?: number;
        total?: number;
      }>(`/measurements/archive?${query.toString()}`);

      const measurements = data.measurements ?? data.items ?? [];
      setTotalPages(data.total_pages ?? 1);
      setTotal(data.total ?? measurements.length);

      let nodeMap: Record<number, string> = {};
      try {
        const current = await apiGet<{ nodes: { node_id: number; node_name: string; sensors: { sensor_id: number }[] }[] }>('/api/current');
        for (const n of current.nodes) {
          for (const s of n.sensors) {
            nodeMap[s.sensor_id] = n.node_name;
          }
        }
      } catch { /* ignore */ }

      const mapped: ArchiveRow[] = measurements.map((m, i) => ({
        id: m.measurement_id ?? i + 1,
        datetime: m.measured_at ? new Date(m.measured_at).toLocaleString('ru-RU') : '—',
        node: (m as any).node_name ?? nodeMap[m.sensor_id] ?? `Датчик #${m.sensor_id}`,
        sensor: (m as any).sensor_name ?? `Sensor #${m.sensor_id}`,
        type: 'Измерение' as const,
        supplyTemp: m.temperature_supply,
        returnTemp: m.temperature_return,
        pressure: m.pressure,
        flowRate: m.flow_rate,
        heatLoad: m.heat_load,
      }));

      setRows(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки архива');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo]);

  useEffect(() => {
    fetchArchive();
  }, [fetchArchive]);

  const nodeNames = ['Все', ...Array.from(new Set(rows.map(r => r.node)))];
  const types = ['Все', 'Измерение', 'Авария'];

  const filtered = rows.filter(r => {
    const matchSearch = search === ''
      || r.node.toLowerCase().includes(search.toLowerCase())
      || r.sensor.toLowerCase().includes(search.toLowerCase())
      || r.datetime.includes(search);
    const matchType = typeFilter === 'Все' || r.type === typeFilter;
    const matchNode = nodeFilter === 'Все' || r.node === nodeFilter;
    return matchSearch && matchType && matchNode;
  });

  const displayRows = filtered;

  function handleFilter(setter: (v: string) => void, val: string) {
    setter(val);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">История событий</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Журнал измерений по всем узлам</p>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-wrap gap-3 items-center transition-colors">
        {/* Date range */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">С</span>
          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
          <span className="text-xs text-slate-500 dark:text-slate-400">по</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="relative flex-1 min-w-40">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по узлу, датчику..."
            className="w-full pl-8 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">Тип:</span>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={e => handleFilter(setTypeFilter, e.target.value)}
              className="appearance-none text-sm border border-slate-200 dark:border-slate-600 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
            >
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 dark:text-slate-400">Узел:</span>
          <div className="relative">
            <select
              value={nodeFilter}
              onChange={e => handleFilter(setNodeFilter, e.target.value)}
              className="appearance-none text-sm border border-slate-200 dark:border-slate-600 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
            >
              {nodeNames.map(n => <option key={n}>{n}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
          {loading ? 'Загрузка...' : `${total} записей`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Загрузка архива...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle size={28} className="text-red-400 mb-2" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={fetchArchive} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">Повторить</button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Дата / Время</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Узел</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Датчик</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Тп, °C</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">То, °C</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Давл., МПа</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Расход</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500 text-sm">Записей не найдено</td>
                    </tr>
                  ) : displayRows.map((row, i) => (
                    <tr key={row.id} className={`border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-800/40'}`}>
                      <td className="px-4 py-3 text-slate-400 dark:text-slate-500 text-xs font-mono">{String(row.id).padStart(3, '0')}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 text-xs whitespace-nowrap">{row.datetime}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{row.node}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Activity size={12} className="text-blue-500" />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{row.sensor}</span>
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-right text-xs font-semibold tabular-nums ${row.supplyTemp != null && row.supplyTemp > 95 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {row.supplyTemp != null ? row.supplyTemp.toFixed(1) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        {row.returnTemp != null ? row.returnTemp.toFixed(1) : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs font-semibold tabular-nums ${row.pressure != null && row.pressure < 0.4 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                        {row.pressure != null ? row.pressure.toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                        {row.flowRate != null ? `${row.flowRate.toFixed(1)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Страница {page} из {totalPages} · {total} записей
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:text-slate-300 transition-colors"
                  >
                    ← Назад
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const p = page <= 3 ? i + 1 : page - 2 + i;
                    if (p > totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 text-xs rounded-lg border transition-colors
                          ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-600 rounded-lg disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700/50 dark:text-slate-300 transition-colors"
                  >
                    Вперёд →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
