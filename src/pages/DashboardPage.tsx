import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, Clock, MapPin, ArrowRight,
  BarChart3, Trash2, Droplets,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  SIGNALEMENT_TYPE_LABELS, SIGNALEMENT_STATUS_LABELS, SIGNALEMENT_STATUS_COLORS,
} from '../lib/supabase';
import type { Signalement, SignalementType, SignalementStatus } from '../lib/supabase';
import { PageHeader, StatCard, Card, LoadingState } from '../components/ui';
import { classNames, timeAgo, formatDate } from '../lib/utils';

const TYPE_COLORS: Record<SignalementType, string> = {
  depot_sauvage: '#d97742',
  inondation: '#3b82f6',
  erosion: '#a67c52',
  pollution_eau: '#06b6d4',
  pollution_air: '#6366f1',
  autre: '#64748b',
};

const STATUS_COLORS_HEX: Record<SignalementStatus, string> = {
  en_attente: '#f59e0b',
  en_cours: '#3b82f6',
  resolu: '#22c55e',
  rejete: '#ef4444',
};

export function DashboardPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mySignalements, setMySignalements] = useState<Signalement[]>([]);
  const [allSignalements, setAllSignalements] = useState<Signalement[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [myRes, allRes] = await Promise.all([
        supabase.from('signalements').select('*, communes(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('signalements').select('type, status, created_at').order('created_at', { ascending: false }).limit(500),
      ]);
      setMySignalements((myRes.data as Signalement[]) ?? []);
      setAllSignalements((allRes.data as Signalement[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const statsByStatus = useMemo(() => {
    const s = { total: allSignalements.length, enAttente: 0, enCours: 0, resolus: 0, rejete: 0 };
    allSignalements.forEach((sig) => {
      if (sig.status === 'en_attente') s.enAttente++;
      else if (sig.status === 'en_cours') s.enCours++;
      else if (sig.status === 'resolu') s.resolus++;
      else if (sig.status === 'rejete') s.rejete++;
    });
    return s;
  }, [allSignalements]);

  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    allSignalements.forEach((s) => { counts[s.type] = (counts[s.type] ?? 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ name: SIGNALEMENT_TYPE_LABELS[type as SignalementType], value: count, type }));
  }, [allSignalements]);

  const statusData = useMemo(() => ([
    { name: SIGNALEMENT_STATUS_LABELS.en_attente, value: statsByStatus.enAttente, status: 'en_attente' },
    { name: SIGNALEMENT_STATUS_LABELS.en_cours, value: statsByStatus.enCours, status: 'en_cours' },
    { name: SIGNALEMENT_STATUS_LABELS.resolu, value: statsByStatus.resolus, status: 'resolu' },
    { name: SIGNALEMENT_STATUS_LABELS.rejete, value: statsByStatus.rejete, status: 'rejete' },
  ].filter((d) => d.value > 0)), [statsByStatus]);

  const last7Days = useMemo(() => {
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: dateStr, label: formatDate(d, 'EEE'), count: 0 });
    }
    allSignalements.forEach((s) => {
      const d = s.created_at.split('T')[0];
      const day = days.find((x) => x.date === d);
      if (day) day.count++;
    });
    return days;
  }, [allSignalements]);

  if (loading) return <div className="w-full px-4 py-8"><LoadingState /></div>;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader
        title={`Bonjour, ${profile?.full_name?.split(' ')[0] ?? 'Citoyen'}`}
        subtitle="Voici un aperçu de l'activité environnementale"
        action={<Link to="/signalements/nouveau" className="btn-primary"><AlertTriangle className="h-4 w-4" /> Nouveau signalement</Link>}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Mes signalements" value={mySignalements.length} icon={<AlertTriangle className="h-5 w-5" />} color="earth" />
        <StatCard label="Total plateforme" value={statsByStatus.total} icon={<BarChart3 className="h-5 w-5" />} color="forest" />
        <StatCard label="Résolus" value={statsByStatus.resolus} icon={<CheckCircle2 className="h-5 w-5" />} color="forest" />
        <StatCard label="En attente" value={statsByStatus.enAttente} icon={<Clock className="h-5 w-5" />} color="amber" />
      </div>

      {/* Charts grid - 2 colonnes équilibrées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Status donut chart */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Répartition par statut</h3>
          {statusData.length > 0 ? (
            <div className="flex flex-row items-center justify-center gap-8 h-full w-full">
              <div className="relative h-[220px] w-[220px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={65} cornerRadius={6}>
                      {statusData.map((d) => <Cell key={d.status} fill={STATUS_COLORS_HEX[d.status as SignalementStatus]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] text-gray-500 uppercase tracking-wide">Total</span>
                  <span className="text-[28px] font-extrabold text-gray-800 leading-none">{statsByStatus.total}</span>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3">
                {statusData.map((d) => {
                  const total = statusData.reduce((s, item) => s + item.value, 0);
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={d.status} className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS_HEX[d.status as SignalementStatus] }} />
                      <span className="font-medium text-sm text-gray-700">{d.name}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">{d.value} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Pas encore de données</div>
          )}
        </Card>

        {/* 7-day trend area chart */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Signalements — 7 derniers jours</h3>
          {last7Days.some((d) => d.count > 0) ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7Days}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={3} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">Pas encore de signalements cette semaine</div>
          )}
        </Card>

        {/* Type breakdown vertical bar chart */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Répartition par type d'incident</h3>
          {typeData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400 text-sm">Pas encore de données</div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Mes signalements récents</h3>
          <Link to="/signalements" className="text-sm font-medium text-forest-600 hover:text-forest-700 flex items-center gap-1">
            Tout voir <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {mySignalements.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-forest-300 mx-auto mb-3" />
            <p className="text-forest-500 mb-4">Vous n'avez pas encore créé de signalement.</p>
            <Link to="/signalements/nouveau" className="btn-primary inline-flex">
              <AlertTriangle className="h-4 w-4" /> Créer mon premier signalement
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-sand-100">
            {mySignalements.map((sig) => (
              <Link key={sig.id} to={`/signalements/${sig.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-sand-50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${TYPE_COLORS[sig.type]}20`, color: TYPE_COLORS[sig.type] }}>
                  {sig.type === 'inondation' || sig.type === 'pollution_eau' ? <Droplets className="h-5 w-5" /> : sig.type === 'depot_sauvage' ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-forest-900 text-sm truncate">{sig.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-forest-400">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{sig.communes?.name ?? 'Non localisé'}</span>
                    <span>{timeAgo(sig.created_at)}</span>
                  </div>
                </div>
                <span className={classNames(SIGNALEMENT_STATUS_COLORS[sig.status])}>
                  {SIGNALEMENT_STATUS_LABELS[sig.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
