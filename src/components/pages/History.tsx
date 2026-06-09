import { useState, useMemo } from 'react';
import { Search, Filter, AlertTriangle, Activity, ChevronDown } from 'lucide-react';

interface HistoryRow {
  id: number;
  datetime: string;
  node: string;
  type: 'Измерение' | 'Авария' | 'Предупреждение';
  supplyTemp: number;
  returnTemp: number;
  pressure: number;
  status: 'Норма' | 'Отклонение' | 'Авария';
}

function makeRows(): HistoryRow[] {
  const nodes = ['ЦТП-1', 'ЦТП-2', 'ЦТП-3', 'НС-4', 'ТУ-5'];
  const types: HistoryRow['type'][] = ['Измерение', 'Измерение', 'Измерение', 'Предупреждение', 'Авария'];
  const statuses: HistoryRow['status'][] = ['Норма', 'Норма', 'Норма', 'Отклонение', 'Авария'];
  const rows: HistoryRow[] = [];
  const now = new Date();
  for (let i = 0; i < 60; i++) {
    const t = new Date(now.getTime() - i * 7 * 60 * 1000);
    const dt = `${t.toLocaleDateString('ru-RU')} ${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
    const typeIdx = Math.floor(Math.random() * 5);
    const sup  = +(65 + Math.random() * 35).toFixed(1);
    const ret  = +(45 + Math.random() * 30).toFixed(1);
    const pres = +(0.3 + Math.random() * 0.8).toFixed(2);
    rows.push({
      id: i + 1,
      datetime: dt,
      node: nodes[Math.floor(Math.random() * nodes.length)],
      type: types[typeIdx],
      supplyTemp: sup,
      returnTemp: ret,
      pressure: pres,
      status: statuses[typeIdx],
    });
  }
  return rows;
}

const ALL_ROWS = makeRows();

const STATUS_CLS: Record<HistoryRow['status'], string> = {
  'Норма':      'bg-green-100 text-green-700',
  'Отклонение': 'bg-amber-100 text-amber-700',
  'Авария':     'bg-red-100 text-red-700',
};

const TYPE_CLS: Record<HistoryRow['type'], string> = {
  'Измерение':     'bg-blue-100 text-blue-700',
  'Предупреждение': 'bg-amber-100 text-amber-700',
  'Авария':        'bg-red-100 text-red-700',
};

const PAGE_SIZE = 12;

export default function History() {
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('Все');
  const [nodeFilter, setNodeFilter] = useState('Все');
  const [page,       setPage]       = useState(1);

  const nodes = ['Все', 'ЦТП-1', 'ЦТП-2', 'ЦТП-3', 'НС-4', 'ТУ-5'];
  const types = ['Все', 'Измерение', 'Предупреждение', 'Авария'];

  const filtered = useMemo(() => {
    return ALL_ROWS.filter(r => {
      const matchSearch = search === '' || r.node.toLowerCase().includes(search.toLowerCase()) || r.type.toLowerCase().includes(search.toLowerCase()) || r.datetime.includes(search);
      const matchType   = typeFilter === 'Все' || r.type === typeFilter;
      const matchNode   = nodeFilter === 'Все' || r.node === nodeFilter;
      return matchSearch && matchType && matchNode;
    });
  }, [search, typeFilter, nodeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilter(setter: (v: string) => void, val: string) {
    setter(val);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-slate-800">История событий</h1>
        <p className="text-sm text-slate-500 mt-0.5">Журнал измерений и аварийных событий по всем узлам</p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Поиск по узлу, типу, дате..."
            className="w-full pl-8 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1.5">
          <Filter size={13} className="text-slate-400" />
          <span className="text-xs text-slate-500">Тип:</span>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={e => handleFilter(setTypeFilter, e.target.value)}
              className="appearance-none text-sm border border-slate-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 cursor-pointer"
            >
              {types.map(t => <option key={t}>{t}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Node filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500">Узел:</span>
          <div className="relative">
            <select
              value={nodeFilter}
              onChange={e => handleFilter(setNodeFilter, e.target.value)}
              className="appearance-none text-sm border border-slate-200 rounded-lg pl-3 pr-7 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 cursor-pointer"
            >
              {nodes.map(n => <option key={n}>{n}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <span className="text-xs text-slate-400 ml-auto">Найдено: {filtered.length}</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Дата / Время</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Узел</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Тип события</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Тп, °C</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">То, °C</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Давл., МПа</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Статус</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">Записей не найдено</td>
                </tr>
              ) : pageRows.map((row, i) => (
                <tr key={row.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                  <td className="px-4 py-3 text-slate-400 text-xs font-mono">{String(row.id).padStart(3, '0')}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{row.datetime}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">{row.node}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {row.type === 'Измерение'
                        ? <Activity size={12} className="text-blue-500" />
                        : <AlertTriangle size={12} className={row.type === 'Авария' ? 'text-red-500' : 'text-amber-500'} />}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${TYPE_CLS[row.type]}`}>{row.type}</span>
                    </div>
                  </td>
                  <td className={`px-4 py-3 text-right text-xs font-semibold tabular-nums ${row.supplyTemp > 95 ? 'text-red-600' : 'text-slate-700'}`}>{row.supplyTemp}</td>
                  <td className="px-4 py-3 text-right text-xs font-semibold text-slate-700 tabular-nums">{row.returnTemp}</td>
                  <td className={`px-4 py-3 text-right text-xs font-semibold tabular-nums ${row.pressure < 0.4 ? 'text-red-600' : 'text-slate-700'}`}>{row.pressure}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CLS[row.status]}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Страница {page} из {totalPages} · {filtered.length} записей
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
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
                      ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Вперёд →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
