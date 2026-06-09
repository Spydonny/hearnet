import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  LayoutDashboard, Activity, Database, FileText, Users, Settings,
  Flame, ChevronDown, UserCircle2,
} from 'lucide-react';

type Page = 'dashboard' | 'monitoring' | 'history' | 'reports' | 'team' | 'settings';

interface Props {
  user: { name: string; role: string };
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

const NODES = [
  'Котельная — ЦТП-1',
  'Котельная — ЦТП-2',
  'Котельная — ЦТП-3',
  'Насосная станция — НС-4',
  'Тепловой узел — ТУ-5',
];

export default function Layout({ user, currentPage, setCurrentPage, children }: Props) {
  const [selectedNode, setSelectedNode] = useState(NODES[0]);
  const [nodeOpen, setNodeOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* ── Sidebar ── */}
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Flame size={16} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 leading-none">HeatNet</div>
            <div className="text-xs text-slate-400 mt-0.5">SCADA Monitor</div>
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
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              <Icon size={16} className={currentPage === id ? 'text-blue-600' : 'text-slate-400'} />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom user card */}
        <div className="px-4 py-3 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-700 truncate">{user.name}</div>
          <div className="text-xs text-slate-400 truncate">{user.role}</div>
        </div>
      </aside>

      {/* ── Right side ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          {/* Node selector */}
          <div className="relative">
            <button
              onClick={() => setNodeOpen(o => !o)}
              className="flex items-center gap-2 border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <span className="font-medium">{selectedNode}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {nodeOpen && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                {NODES.map(n => (
                  <button
                    key={n}
                    onClick={() => { setSelectedNode(n); setNodeOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${selectedNode === n ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800 leading-none">{user.name}</div>
              <div className="text-xs text-slate-400 mt-0.5">{user.role}</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
              <UserCircle2 size={20} className="text-blue-600" />
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
