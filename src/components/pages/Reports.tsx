import { useState, useEffect, useCallback } from 'react';
import { FileText, Download, Calendar, BarChart2, TrendingUp, AlertTriangle, Loader2, X, Plus } from 'lucide-react';
import { apiGet, apiPost, apiDownload } from '../../utils/api';
import type { ApiReport } from '../../utils/api';

interface ReportRow {
  id: number;
  title: string;
  period: string;
  generated: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  file_path: string;
  userId: number;
}

const TYPE_LABEL: Record<string, string> = {
  daily: 'Ежедневный',
  weekly: 'Еженедельный',
  monthly: 'Ежемесячный',
};

const TYPE_META: Record<string, { badge: string; icon: React.ElementType; dot: string }> = {
  daily:   { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Calendar,   dot: 'bg-blue-500' },
  weekly:  { badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', icon: BarChart2, dot: 'bg-violet-500' },
  monthly: { badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: TrendingUp, dot: 'bg-emerald-500' },
};

export default function Reports() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showGenerate, setShowGenerate] = useState(false);
  const [genDateFrom, setGenDateFrom] = useState('');
  const [genDateTo, setGenDateTo] = useState('');
  const [genNodeId, setGenNodeId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [genSuccess, setGenSuccess] = useState('');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<{
        reports?: ApiReport[];
        items?: ApiReport[];
        total?: number;
      }>('/reports');

      const list = data.reports ?? data.items ?? [];
      const mapped: ReportRow[] = list.map(r => ({
        id: r.report_id,
        title: `${TYPE_LABEL[r.report_type] ?? 'Отчёт'} — ${r.date_from} / ${r.date_to}`,
        period: `${r.date_from} — ${r.date_to}`,
        generated: r.created_at ? new Date(r.created_at).toLocaleString('ru-RU') : '—',
        reportType: r.report_type,
        file_path: r.file_path,
        userId: r.user_id,
      }));
      setReports(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки отчётов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function handleDownload(reportId: number, format: 'csv' | 'xlsx') {
    try {
      const blob = await apiDownload(`/reports/export/${format}?id=${reportId}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${reportId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Ошибка скачивания: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setGenError('');
    setGenSuccess('');
    setGenerating(true);
    try {
      const body: Record<string, string | number> = {
        date_from: genDateFrom,
        date_to: genDateTo,
        // both formats generated automatically
      };
      if (genNodeId) body.node_id = Number(genNodeId);

      const result = await apiPost<{ detail: string; id: number; file_path?: string }>('/reports/generate', body);
      setGenSuccess(`Отчёт #${result.id} сгенерирован успешно`);
      setShowGenerate(false);
      fetchReports();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Ошибка генерации');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">Отчёты</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Сформированные отчёты по работе тепловой сети</p>
        </div>
        <button
          onClick={() => setShowGenerate(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Plus size={15} />
          Сформировать отчет
        </button>
      </div>

      {showGenerate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowGenerate(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 w-full max-w-md mx-4 transition-colors" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Сформировать отчёт</h3>
              <button onClick={() => setShowGenerate(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            {genSuccess && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-xs rounded-lg px-3 py-2">{genSuccess}</div>
            )}
            {genError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-xs rounded-lg px-3 py-2">{genError}</div>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Дата от</label>
                  <input type="date" value={genDateFrom} onChange={e => setGenDateFrom(e.target.value)}
                    required
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Дата до</label>
                  <input type="date" value={genDateTo} onChange={e => setGenDateTo(e.target.value)}
                    required
                    className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">ID узла (необязательно)</label>
                <input type="number" value={genNodeId} onChange={e => setGenNodeId(e.target.value)}
                  placeholder="Оставьте пустым для всех узлов"
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
              </div>

              <button type="submit" disabled={generating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors">
                {generating ? 'Генерация CSV и XLSX...' : 'Сформировать'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Всего отчётов', value: String(reports.length), icon: FileText, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Типов отчётов', value: String(new Set(reports.map(r => r.reportType)).size), icon: BarChart2, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30' },
          { label: 'Скачиваний', value: '—', icon: Download, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-center gap-4 transition-colors">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Список отчётов</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Загрузка отчётов...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle size={28} className="text-red-400 mb-2" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={fetchReports} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">Повторить</button>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
            Отчётов пока нет. Нажмите «Сформировать отчёт», чтобы создать первый.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Отчёт</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Тип</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Период</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Сформирован</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Скачать</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => {
                const meta = TYPE_META[r.reportType] ?? TYPE_META.daily;
                const label = TYPE_LABEL[r.reportType] ?? 'Отчёт';
                return (
                  <tr key={r.id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-slate-500 dark:text-slate-400" />
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{r.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.dot}`} />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${meta.badge}`}>{label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">{r.period}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">{r.generated}</td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleDownload(r.id, 'csv')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Download size={12} />
                          CSV
                        </button>
                        <button
                          onClick={() => handleDownload(r.id, 'xlsx')}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <Download size={12} />
                          XLSX
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
