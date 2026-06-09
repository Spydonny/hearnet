import { useState } from 'react';
import './index.css';
import Login    from './components/Login';
import Layout   from './components/Layout';
import Dashboard  from './components/pages/Dashboard';
import Monitoring from './components/pages/Monitoring';
import History    from './components/pages/History';
import Reports    from './components/pages/Reports';
import Team       from './components/pages/Team';
import Settings   from './components/pages/Settings';

type Page = 'dashboard' | 'monitoring' | 'history' | 'reports' | 'team' | 'settings';

interface User { id?: number; name: string; role: string; login?: string; }

export default function App() {
  const [user,        setUser]        = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

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
