import { useState } from 'react';
import type { FormEvent } from 'react';
import { Flame, Thermometer, Gauge, Activity, AlertCircle } from 'lucide-react';
import { apiPost } from '../utils/api';
import type { LoginResponse } from '../utils/api';

interface Props {
  onLogin: (user: { name: string; role: string; login?: string; id?: number }) => void;
}

export default function Login({ onLogin }: Props) {
  const [login,   setLogin]   = useState('');
  const [password, setPassword] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiPost<LoginResponse>('/login', { login, password });
      onLogin({
        name:  data.user.full_name,
        role:  data.user.role,
        login: data.user.login,
        id:    data.user.id,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Left — branding */}
      <div className="hidden lg:flex flex-col w-1/2 bg-blue-700 text-white p-12 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 6 }).map((_, col) => (
              <div
                key={`${row}-${col}`}
                className="absolute border border-white rounded-full"
                style={{
                  width: (row + col + 2) * 60,
                  height: (row + col + 2) * 60,
                  top: row * 120 - 100,
                  left: col * 120 - 100,
                }}
              />
            ))
          )}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Flame size={22} className="text-white" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">HeatNet SCADA</div>
              <div className="text-blue-200 text-xs">Система мониторинга тепловых сетей</div>
            </div>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-4">
            Контроль и управление<br />
            тепловой инфраструктурой
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-sm">
            Централизованный мониторинг тепловых узлов в реальном времени.
            Аналитика, аварийные оповещения и отчётность — в едином интерфейсе.
          </p>
        </div>

        <div className="relative z-10 mt-auto grid grid-cols-3 gap-4">
          {[
            { icon: Thermometer, label: 'Датчиков',     value: '24' },
            { icon: Gauge,       label: 'Узлов',        value: '5'  },
            { icon: Activity,    label: 'Событий / сут.', value: '120+' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <Icon size={18} className="text-blue-200 mb-2" />
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-blue-200 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="relative z-10 mt-6 text-blue-300 text-xs">
          ГКП «Теплоснабжение» · SCADA v2.4.1 · © 2026
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Flame size={16} className="text-white" />
            </div>
            <span className="font-bold text-slate-800">HeatNet SCADA</span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Авторизация</h2>
            <p className="text-slate-500 text-sm mb-6">Введите данные для входа в систему</p>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-5">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Логин
                </label>
                <input
                  type="text"
                  value={login}
                  onChange={e => setLogin(e.target.value)}
                  placeholder="Введите логин"
                  autoComplete="username"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  autoComplete="current-password"
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm"
              >
                {loading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Система предназначена только для авторизованных сотрудников
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
