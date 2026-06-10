import { useState, useEffect, useCallback } from 'react';
import { UserCircle2, Shield, Wrench, Radio, Loader2, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../utils/api';
import type { ApiUser } from '../../utils/api';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Администратор',
  operator: 'Диспетчер',
  engineer: 'Инженер',
  energetic: 'Энергетик',
};

const ROLE_META: Record<string, { cls: string; icon: React.ElementType }> = {
  Администратор: { cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300', icon: Shield },
  Диспетчер:     { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',     icon: Radio },
  Инженер:       { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', icon: Wrench },
  Энергетик:     { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',   icon: Wrench },
};

function defaultMeta(role: string) {
  return ROLE_META[role] ?? { cls: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300', icon: UserCircle2 };
}

export default function Team() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet<{
        users?: ApiUser[];
        items?: ApiUser[];
      }>('/admin/users');

      const list = data.users ?? data.items ?? [];
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const active = users.filter(u => u.status === 'active').length;
  const inactive = users.length - active;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">Команда</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Сотрудники системы мониторинга</p>
        </div>
        {!loading && users.length > 0 && (
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Активны: {active}
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Неактивны: {inactive}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Загрузка данных...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle size={28} className="text-red-400 mb-2" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button onClick={fetchUsers} className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">Повторить</button>
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">Пользователи не найдены</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                {['ID', 'Сотрудник', 'Логин', 'Роль', 'Статус'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const roleLabel = ROLE_LABEL[u.role] ?? u.role;
                const { cls, icon: RoleIcon } = defaultMeta(roleLabel);
                return (
                  <tr key={u.id} className={`border-b border-slate-50 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/40 dark:bg-slate-800/40' : ''}`}>
                    <td className="px-4 py-3.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
                      {String(u.id).padStart(2, '0')}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center flex-shrink-0">
                          <UserCircle2 size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 text-sm">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 font-mono">{u.login}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <RoleIcon size={12} className={roleLabel === 'Администратор' ? 'text-violet-600 dark:text-violet-400' : roleLabel === 'Диспетчер' ? 'text-blue-600 dark:text-blue-400' : roleLabel === 'Инженер' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'} />
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${cls}`}>{roleLabel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${u.status === 'active' ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <span className={`text-xs font-semibold ${u.status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {u.status === 'active' ? 'Активен' : 'Неактивен'}
                        </span>
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
