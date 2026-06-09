import { UserCircle2, Shield, Wrench, Radio } from 'lucide-react';

interface TeamMember {
  id: number;
  name: string;
  login: string;
  role: 'Администратор' | 'Диспетчер' | 'Инженер';
  node: string;
  shift: string;
  status: 'Активен' | 'Не в сети';
  lastSeen: string;
}

const TEAM: TeamMember[] = [
  { id: 1, name: 'Жуматов Серик Бекович',     login: 'zhumatov_s',   role: 'Администратор', node: 'Все узлы',  shift: '08:00–20:00', status: 'Активен',   lastSeen: 'Сейчас' },
  { id: 2, name: 'Ахметов Арман Серикович',    login: 'akhmetov_a',   role: 'Диспетчер',     node: 'ЦТП-1',    shift: '08:00–20:00', status: 'Активен',   lastSeen: 'Сейчас' },
  { id: 3, name: 'Нурланов Данияр Маратович',  login: 'nurlanov_d',   role: 'Инженер',       node: 'ЦТП-2',    shift: '08:00–20:00', status: 'Активен',   lastSeen: '5 мин назад' },
  { id: 4, name: 'Сейткали Айгерим Жановна',   login: 'seitkali_a',   role: 'Диспетчер',     node: 'ЦТП-3',    shift: '20:00–08:00', status: 'Не в сети', lastSeen: 'Вчера 20:02' },
  { id: 5, name: 'Байжанов Темиртас Ержанов',  login: 'baizhan_t',    role: 'Инженер',       node: 'НС-4',      shift: '08:00–20:00', status: 'Активен',   lastSeen: '12 мин назад' },
  { id: 6, name: 'Омарова Гульнара Сериковна', login: 'omarova_g',    role: 'Диспетчер',     node: 'ТУ-5',      shift: '20:00–08:00', status: 'Не в сети', lastSeen: 'Вчера 08:15' },
  { id: 7, name: 'Касымов Бауыржан Нурлыбаев', login: 'kasymov_b',    role: 'Инженер',       node: 'ЦТП-1',    shift: '08:00–20:00', status: 'Активен',   lastSeen: '2 мин назад' },
  { id: 8, name: 'Иванова Людмила Петровна',   login: 'ivanova_l',    role: 'Администратор', node: 'Все узлы',  shift: 'Гибкий',      status: 'Не в сети', lastSeen: 'Вчера 17:40' },
];

const ROLE_META = {
  'Администратор': { cls: 'bg-violet-100 text-violet-700', icon: Shield },
  'Диспетчер':     { cls: 'bg-blue-100 text-blue-700',     icon: Radio },
  'Инженер':       { cls: 'bg-emerald-100 text-emerald-700', icon: Wrench },
};

export default function Team() {
  const active    = TEAM.filter(m => m.status === 'Активен').length;
  const inactive  = TEAM.length - active;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800">Команда</h1>
          <p className="text-sm text-slate-500 mt-0.5">Сотрудники системы мониторинга</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            В сети: {active}
          </span>
          <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 font-semibold px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Не в сети: {inactive}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['ID', 'Сотрудник', 'Логин', 'Роль', 'Узел', 'Смена', 'Статус', 'Последний вход'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TEAM.map((m, i) => {
              const { cls, icon: RoleIcon } = ROLE_META[m.role];
              return (
                <tr key={m.id} className={`border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors ${i % 2 !== 0 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">
                    {String(m.id).padStart(2, '0')}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center flex-shrink-0">
                        <UserCircle2 size={18} className="text-blue-600" />
                      </div>
                      <span className="font-semibold text-slate-700 text-sm">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500 font-mono">{m.login}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <RoleIcon size={12} className={m.role === 'Администратор' ? 'text-violet-600' : m.role === 'Диспетчер' ? 'text-blue-600' : 'text-emerald-600'} />
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${cls}`}>{m.role}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-md" style={{ maxWidth: 80 }}>
                    <span className="inline-block bg-slate-100 px-2 py-0.5 rounded-md">{m.node}</span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{m.shift}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.status === 'Активен' ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <span className={`text-xs font-semibold ${m.status === 'Активен' ? 'text-green-700' : 'text-slate-400'}`}>
                        {m.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">{m.lastSeen}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
