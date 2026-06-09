import { useState } from 'react';
import { FileText, Download, Calendar, BarChart2, TrendingUp, AlertTriangle } from 'lucide-react';

interface Report {
  id: number;
  title: string;
  period: string;
  generated: string;
  type: 'Ежедневный' | 'Еженедельный' | 'Аварийный';
  size: string;
  events: number;
}

const REPORTS: Report[] = [
  { id: 1, title: 'Ежедневный отчёт — 09.06.2026', period: '09.06.2026', generated: '10.06.2026 00:05', type: 'Ежедневный', size: '124 КБ', events: 148 },
  { id: 2, title: 'Ежедневный отчёт — 08.06.2026', period: '08.06.2026', generated: '09.06.2026 00:05', type: 'Ежедневный', size: '118 КБ', events: 132 },
  { id: 3, title: 'Еженедельный отчёт — Нед. 23', period: '02.06–08.06.2026', generated: '09.06.2026 01:00', type: 'Еженедельный', size: '541 КБ', events: 901 },
  { id: 4, title: 'Аварийный отчёт — ЦТП-2 перегрев', period: '07.06.2026 14:22', generated: '07.06.2026 15:00', type: 'Аварийный', size: '89 КБ', events: 3 },
  { id: 5, title: 'Ежедневный отчёт — 07.06.2026', period: '07.06.2026', generated: '08.06.2026 00:05', type: 'Ежедневный', size: '201 КБ', events: 165 },
  { id: 6, title: 'Еженедельный отчёт — Нед. 22', period: '26.05–01.06.2026', generated: '02.06.2026 01:00', type: 'Еженедельный', size: '498 КБ', events: 843 },
  { id: 7, title: 'Аварийный отчёт — НС-4 падение давления', period: '03.06.2026 09:11', generated: '03.06.2026 09:45', type: 'Аварийный', size: '72 КБ', events: 2 },
];

const TYPE_CLS = {
  'Ежедневный':   { badge: 'bg-blue-100 text-blue-700',   icon: Calendar,    dot: 'bg-blue-500' },
  'Еженедельный': { badge: 'bg-violet-100 text-violet-700', icon: BarChart2,   dot: 'bg-violet-500' },
  'Аварийный':    { badge: 'bg-red-100 text-red-700',      icon: AlertTriangle, dot: 'bg-red-500' },
};

function downloadCSV() {
  const header = 'ID,Название,Тип,Период,Сформирован,Событий,Размер';
  const rows = REPORTS.map(r =>
    `${r.id},"${r.title}",${r.type},${r.period},${r.generated},${r.events},${r.size}`
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'reports.csv'; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel() {
  const header = 'ID\tНазвание\tТип\tПериод\tСформирован\tСобытий\tРазмер';
  const rows = REPORTS.map(r =>
    `${r.id}\t${r.title}\t${r.type}\t${r.period}\t${r.generated}\t${r.events}\t${r.size}`
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'reports.xls'; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Отчёты</h1>
          <p className="text-sm text-slate-500 mt-0.5">Сформированные отчёты по работе тепловой сети</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(o => !o)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <FileText size={15} />
            Сформировать отчет
          </button>
          {isMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-slate-200 shadow-md rounded-md z-50 overflow-hidden">
              <button
                onClick={() => { downloadCSV(); setIsMenuOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-100 whitespace-nowrap"
              >
                Скачать CSV
              </button>
              <button
                onClick={() => { downloadExcel(); setIsMenuOpen(false); }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-slate-100 whitespace-nowrap"
              >
                Скачать Excel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Всего отчётов', value: String(REPORTS.length), icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Аварийных', value: String(REPORTS.filter(r => r.type === 'Аварийный').length), icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Событий за период', value: String(REPORTS.reduce((s, r) => s + r.events, 0)), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Reports list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-700">Список отчётов</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Отчёт</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Тип</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Период</th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Сформирован</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Событий</th>
              <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Размер</th>
              <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Действие</th>
            </tr>
          </thead>
          <tbody>
            {REPORTS.map(r => {
              const { badge, dot } = TYPE_CLS[r.type];
              return (
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-slate-500" />
                      </div>
                      <span className="font-medium text-slate-700 text-sm">{r.title}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${badge}`}>
                        {r.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{r.period}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{r.generated}</td>
                  <td className="px-5 py-3.5 text-right text-sm font-semibold text-slate-700 tabular-nums">{r.events}</td>
                  <td className="px-5 py-3.5 text-right text-xs text-slate-400">{r.size}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                      <Download size={12} />
                      Скачать
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
