import { useState } from 'react';
import { UserCircle2, Bell, Monitor, LogOut, ChevronDown, Moon, Sun } from 'lucide-react';

interface Props {
  user: { name: string; role: string };
  onLogout: () => void;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative block rounded-full transition-colors focus:outline-none flex-shrink-0 ${value ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-600'}`}
      style={{ width: 44, height: 24, boxSizing: 'border-box' }}
    >
      <span
        className="absolute top-1 h-4 w-4 rounded-full bg-white dark:bg-slate-300 shadow transition-all duration-200"
        style={{ left: value ? 24 : 4 }}
      />
    </button>
  );
}

export default function Settings({ user, onLogout }: Props) {
  const [sysErrors,   setSysErrors]   = useState(true);
  const [emailReport, setEmailReport] = useState(false);
  const [theme,       setTheme]       = useState(
    document.documentElement.classList.contains('dark') ? 'Тёмная' : 'Светлая'
  );

  function handleThemeChange(val: string) {
    setTheme(val);
    const isDark = val === 'Тёмная';
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('scada-theme', isDark ? 'dark' : 'light');
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-lg font-bold text-slate-800 dark:text-white">Настройки</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Параметры учётной записи и системы</p>
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2 transition-colors">
          <UserCircle2 size={15} className="text-slate-500 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Профиль</h2>
        </div>
        <div className="p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center flex-shrink-0">
            <UserCircle2 size={30} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-slate-800 dark:text-white">{user.name}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{user.role}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 dark:text-slate-500">Статус</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-400">Активен</span>
            </div>
          </div>
        </div>
        <div className="px-5 pb-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-lg px-4 py-3 transition-colors">
            <div className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">ФИО</div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.name}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-lg px-4 py-3 transition-colors">
            <div className="text-xs text-slate-400 dark:text-slate-500 mb-0.5">Должность</div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user.role}</div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2 transition-colors">
          <Bell size={15} className="text-slate-500 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Уведомления</h2>
        </div>
        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
          {[
            { label: 'Системные ошибки', desc: 'Получать уведомления об аварийных событиях и сбоях', value: sysErrors, set: setSysErrors },
            { label: 'Отчёты на почту',  desc: 'Автоматически отправлять ежедневные отчёты по e-mail', value: emailReport, set: setEmailReport },
          ].map(({ label, desc, value, set }) => (
            <div key={label} className="flex items-center justify-between w-full py-4 px-6 pr-8 transition-colors">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{desc}</div>
              </div>
              <div className="flex-shrink-0 ml-6 mr-4">
                <Toggle value={value} onChange={set} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-colors">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2 transition-colors">
          <Monitor size={15} className="text-slate-500 dark:text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Система</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Тема оформления</div>
              <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Выберите цветовую схему интерфейса</div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${theme === 'Тёмная' ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                {theme === 'Тёмная' ? (
                  <Moon size={14} className="text-amber-600 dark:text-amber-400" />
                ) : (
                  <Sun size={14} className="text-slate-500" />
                )}
              </div>
              <div className="relative">
                <select
                  value={theme}
                  onChange={e => handleThemeChange(e.target.value)}
                  className="appearance-none text-sm border border-slate-200 dark:border-slate-600 rounded-lg pl-4 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                >
                  <option>Светлая</option>
                  <option>Тёмная</option>
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
            <span>Версия системы: SCADA-HN v2.4.1</span>
            <span>© 2026 ГКП «Теплоснабжение»</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Выход из системы</div>
            <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Завершить текущую сессию и вернуться на страницу входа</div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={15} />
            Выйти из аккаунта
          </button>
        </div>
      </div>
    </div>
  );
}
