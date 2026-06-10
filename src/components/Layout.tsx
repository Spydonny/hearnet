import type { ReactNode } from 'react';
import {
  LayoutDashboard, Activity, Database, FileText, Users, Settings,
  Flame, UserCircle2,
} from 'lucide-react';

type Page = 'dashboard' | 'monitoring' | 'history' | 'reports' | 'team' | 'settings';

interface Props {
  user: { name: string; role: string; login?: string; id?: number };
  currentPage: Page;
  setCurrentPage: (p: Page) => void;
  onLogout: () => void;
  children: ReactNode;
}

const NAV: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard',  label: 'Главная',    icon: LayoutDashboard },
  { id: 'monitoring', label: 'Мониторинг', icon: Activity },
  { id: 'history',    label: 'История',    icon: Database },
  { id: 'reports',    label: 'Отчёты',     icon: FileText },
  { id: 'team',       label: 'Команда',    icon: Users },
  { id: 'settings',   label: 'Настройки',  icon: Settings },
];

export default function Layout({ user, currentPage, setCurrentPage, children }: Props) {
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden transition-colors" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col flex-shrink-0 transition-colors">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Flame size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-white leading-none">HeatNet</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">SCADA Monitor</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors
                ${currentPage === id
                  ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              <Icon size={16} className={currentPage === id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom user card */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{user.name}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500 truncate">{user.role}</div>
        </div>
      </aside>

      {/* ── Right side ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between flex-shrink-0 transition-colors">
          <div></div>
          {/* Node selector
          <div className="relative">
            {loadingNodes ? (
              <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-600 rounded-lg px-3.5 py-2 text-sm text-slate-400 dark:text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Загрузка...
              </div>
            ) : (
              <button
                onClick={() => setNodeOpen(o => !o)}
                className="flex items-center gap-2 border border-slate-200 dark:border-slate-600 rounded-lg px-3.5 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <span className="font-medium">{selectedNode || 'Нет узлов'}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>
            )}
            {nodeOpen && nodes.length > 0 && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg dark:shadow-black/30 z-20 py-1 overflow-hidden">
                {nodes.map(n => (
                  <button
                    key={n.node_id}
                    onClick={() => { setSelectedNode(n.node_name); setNodeOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${selectedNode === n.node_name ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                  >
                    {n.node_name}
                  </button>
                ))}
              </div>
            )}
          </div> */}

          {/* Right side: user info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800 dark:text-white leading-none">{user.name}</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{user.role}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <UserCircle2 size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
