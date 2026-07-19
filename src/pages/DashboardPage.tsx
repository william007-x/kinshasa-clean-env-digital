import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, CheckCircle2, Clock, MapPin, Trophy,
  ArrowRight, BarChart3, Trash2, Droplets,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  SIGNALEMENT_TYPE_LABELS, SIGNALEMENT_STATUS_LABELS, SIGNALEMENT_STATUS_COLORS,
  LEVEL_LABELS, getLevelFromPoints, LEVEL_THRESHOLDS,
} from '../lib/supabase';
import type { Signalement, SignalementType, SignalementStatus } from '../lib/supabase';
import { PageHeader, StatCard, Card, LoadingState, ProgressBar } from '../components/ui';
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
  resolu: '#16a34a',
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

  const currentLevel = getLevelFromPoints(profile?.points ?? 0);
  const nextLevel = currentLevel === 'debutant' ? 'actif' : currentLevel === 'actif' ? 'militant' : currentLevel === 'militant' ? 'ambassadeur' : null;
  const nextThreshold = nextLevel ? LEVEL_THRESHOLDS[nextLevel] : null;
  const levelProgress = nextThreshold ? ((profile?.points ?? 0) / nextThreshold) * 100 : 100;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader
        title={`Bonjour, ${profile?.full_name?.split(' ')[0] ?? 'Citoyen'}`}
        subtitle={`Voici un aperçu de l'activité environnementale — ${LEVEL_LABELS[currentLevel]}`}
        action={<Link to="/signalements/nouveau" className="btn-primary"><AlertTriangle className="h-4 w-4" /> Nouveau signalement</Link>}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Mes signalements" value={mySignalements.length} icon={<AlertTriangle className="h-5 w-5" />} color="earth" />
        <StatCard label="Total plateforme" value={statsByStatus.total} icon={<BarChart3 className="h-5 w-5" />} color="forest" />
        <StatCard label="Résolus" value={statsByStatus.resolus} icon={<CheckCircle2 className="h-5 w-5" />} color="forest" />
        <StatCard label="En attente" value={statsByStatus.enAttente} icon={<Clock className="h-5 w-5" />} color="amber" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Eco-citizen progress */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-600">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-forest-900">Progression éco-citoyenne</h3>
              <p className="text-xs text-forest-500">{profile?.points} points</p>
            </div>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-forest-700">{LEVEL_LABELS[currentLevel]}</span>
              {nextLevel && <span className="text-forest-400">{LEVEL_LABELS[nextLevel]}</span>}
            </div>
            <ProgressBar value={levelProgress} />
          </div>
          {nextThreshold && (
            <p className="text-xs text-forest-500">
              Plus que <span className="font-semibold text-forest-700">{nextThreshold - (profile?.points ?? 0)}</span> points pour atteindre le niveau {LEVEL_LABELS[nextLevel as 'actif' | 'militant' | 'ambassadeur']}
            </p>
          )}
          <Link to="/classement" className="mt-4 flex items-center gap-1.5 text-sm font-medium text-forest-600 hover:text-forest-700">
            Voir le classement <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>

        {/* Status pie chart */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-display font-semibold text-forest-900 mb-4">Répartition par statut</h3>
          {statusData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                    {statusData.map((d) => <Cell key={d.status} fill={STATUS_COLORS_HEX[d.status as SignalementStatus]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {statusData.map((d) => (
                  <div key={d.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: STATUS_COLORS_HEX[d.status as SignalementStatus] }} />
                      <span className="text-sm text-forest-700">{d.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-forest-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-forest-400 text-sm">Pas encore de données</div>
          )}
        </Card>
      </div>

      {/* 7-day trend + Type breakdown */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-4">Signalements — 7 derniers jours</h3>
          {last7Days.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebe6d3" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-forest-400 text-sm">Pas encore de signalements cette semaine</div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-4">Répartition par type d'incident</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={typeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ebe6d3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {typeData.map((d) => <Cell key={d.type} fill={TYPE_COLORS[d.type as SignalementType]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-8 text-center text-forest-400 text-sm">Pas encore de données</div>
          )}
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-sand-200 flex items-center justify-between">
          <h3 className="font-display font-semibold text-forest-900">Mes signalements récents</h3>
          <Link to="/signalements" className="text-sm font-medium text-forest-600 hover:text-forest-700 flex items-center gap-1">
            Tout voir <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {mySignalements.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <AlertTriangle className="h-10 w-10 text-forest-300 mx-auto mb-3" />
            <p className="text-forest-500 mb-4">Vous n'avez pas encore créé de signalement.</p>
            <Link to="/signalements/nouveau" className="btn-primary inline-flex">
              <AlertTriangle className="h-4 w-4" /> Créer mon premier signalement
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-sand-100">
            {mySignalements.map((sig) => (
              <Link key={sig.id} to={`/signalements/${sig.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-sand-50 transition-colors">
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
