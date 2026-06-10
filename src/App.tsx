import { useState, useEffect } from 'react';
import './index.css';
import { Loader2 } from 'lucide-react';
import Login    from './components/Login';
import Layout   from './components/Layout';
import Dashboard  from './components/pages/Dashboard';
import Monitoring from './components/pages/Monitoring';
import History    from './components/pages/History';
import Reports    from './components/pages/Reports';
import Team       from './components/pages/Team';
import Settings   from './components/pages/Settings';
import { useTheme } from './utils/useTheme';
import { apiGet } from './utils/api';
import type { LoginResponse } from './utils/api';

type Page = 'dashboard' | 'monitoring' | 'history' | 'reports' | 'team' | 'settings';

interface User { id?: number; name: string; role: string; login?: string; }

export default function App() {
  const [user,        setUser]        = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [restoring,   setRestoring]   = useState(true);

  // Initial theme setup from localStorage / system preference
  useTheme();

  // Restore session on refresh
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const data = await apiGet<LoginResponse>('/login');
        if (cancelled || !data.user) return;
        setUser({
          name:  data.user.full_name,
          role:  data.user.role,
          login: data.user.login,
          id:    data.user.id,
        });
      } catch {
        // 401 or offline — stay on login
      } finally {
        if (!cancelled) setRestoring(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  if (restoring) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Проверка сессии...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={u => { setUser(u); setCurrentPage('dashboard'); }} />;
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':  return <Dashboard />;
      case 'monitoring': return <Monitoring />;
      case 'history':    return <History />;
      case 'reports':    return <Reports />;
      case 'team':       return <Team />;
      case 'settings':   return <Settings user={user!} onLogout={() => setUser(null)} />;
      default:           return <Dashboard />;
    }
  }

  return (
    <Layout
      user={user}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      onLogout={() => setUser(null)}
    >
      {renderPage()}
    </Layout>
  );
}
