import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3, TrendingUp, MapPin, Download,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts';
import { supabase } from '../lib/supabase';
import {
  SIGNALEMENT_TYPE_LABELS, type Signalement, type SignalementType, type Commune,
} from '../lib/supabase';
import { PageHeader, Card, LoadingState, StatCard } from '../components/ui';
import { formatDate } from '../lib/utils';

const TYPE_COLORS: Record<string, string> = {
  depot_sauvage: '#d97742',
  inondation: '#3b82f6',
  erosion: '#a67c52',
  pollution_eau: '#06b6d4',
  pollution_air: '#6366f1',
  autre: '#64748b',
};

export function StatistiquesPage() {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    (async () => {
      const [sigRes, comRes] = await Promise.all([
        supabase.from('signalements').select('type, status, created_at, commune_id').order('created_at', { ascending: false }).limit(2000),
        supabase.from('communes').select('*'),
      ]);
      setSignalements((sigRes.data as Signalement[]) ?? []);
      setCommunes((comRes.data as Commune[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filteredByPeriod = useMemo(() => {
    const days = parseInt(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return signalements.filter((s) => new Date(s.created_at) >= cutoff);
  }, [signalements, period]);

  const timeSeries = useMemo(() => {
    const days = parseInt(period);
    const data: { date: string; label: string; count: number; resolu: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data.push({ date: dateStr, label: formatDate(d, 'dd/MM'), count: 0, resolu: 0 });
    }
    filteredByPeriod.forEach((s) => {
      const d = s.created_at.split('T')[0];
      const day = data.find((x) => x.date === d);
      if (day) {
        day.count++;
        if (s.status === 'resolu') day.resolu++;
      }
    });
    return data;
  }, [filteredByPeriod, period]);

  const byType = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredByPeriod.forEach((s) => { counts[s.type] = (counts[s.type] ?? 0) + 1; });
    return Object.entries(counts).map(([type, count]) => ({ name: SIGNALEMENT_TYPE_LABELS[type as SignalementType], value: count, type }));
  }, [filteredByPeriod]);

  const byCommune = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredByPeriod.forEach((s) => {
      if (s.commune_id) counts[s.commune_id] = (counts[s.commune_id] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, count]) => ({ name: communes.find((c) => c.id === id)?.name ?? 'Inconnu', value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredByPeriod, communes]);

  function exportCSV() {
    const rows = [['Date', 'Type', 'Statut', 'Commune'], ...filteredByPeriod.map((s) => [
      s.created_at, s.type, s.status, communes.find((c) => c.id === s.commune_id)?.name ?? '',
    ])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinshasaeco_stats_${period}j.csv`;
    a.click();
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8"><LoadingState /></div>;

  const resolvedCount = filteredByPeriod.filter((s) => s.status === 'resolu').length;
  const resolutionRate = filteredByPeriod.length > 0 ? Math.round((resolvedCount / filteredByPeriod.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader
        title="Statistiques"
        subtitle="Indicateurs environnementaux de la ville de Kinshasa"
        action={
          <div className="flex gap-2">
            <select value={period} onChange={(e) => setPeriod(e.target.value as '7' | '30' | '90')} className="input w-32">
              <option value="7">7 jours</option>
              <option value="30">30 jours</option>
              <option value="90">90 jours</option>
            </select>
            <button onClick={exportCSV} className="btn-secondary"><Download className="h-4 w-4" /> CSV</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Signalements" value={filteredByPeriod.length} icon={<BarChart3 className="h-5 w-5" />} color="forest" />
        <StatCard label="Résolus" value={resolvedCount} icon={<TrendingUp className="h-5 w-5" />} color="forest" />
        <StatCard label="Taux de résolution" value={`${resolutionRate}%`} icon={<TrendingUp className="h-5 w-5" />} color="river" />
        <StatCard label="Communes touchées" value={byCommune.length} icon={<MapPin className="h-5 w-5" />} color="earth" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Time series */}
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-display font-semibold text-forest-900 mb-4">Évolution des signalements ({period} jours)</h3>
          {timeSeries.some((d) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timeSeries}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ebe6d3" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} interval={Math.max(1, Math.floor(timeSeries.length / 10))} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="count" name="Total" stroke="#16a34a" strokeWidth={2} fill="url(#colorCount)" />
                <Area type="monotone" dataKey="resolu" name="Résolus" stroke="#3b82f6" strokeWidth={2} fill="url(#colorResolu)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-12 text-center text-forest-400 text-sm">Pas de données pour cette période</div>
          )}
        </Card>

        {/* By type */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-4">Par type d'incident</h3>
          {byType.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                    {byType.map((d) => <Cell key={d.type} fill={TYPE_COLORS[d.type]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {byType.map((d) => (
                  <div key={d.type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[d.type] }} />
                      <span className="text-forest-700">{d.name}</span>
                    </div>
                    <span className="font-semibold text-forest-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="py-8 text-center text-forest-400 text-sm">Pas de données</div>}
        </Card>

        {/* By commune */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-4">Top 10 communes</h3>
          {byCommune.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byCommune} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ebe6d3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} width={90} />
                <Tooltip />
                <Bar dataKey="value" fill="#16a34a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="py-8 text-center text-forest-400 text-sm">Pas de données</div>}
        </Card>
      </div>

      {/* Commune eco-scores table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-sand-200">
          <h3 className="font-display font-semibold text-forest-900">Indice de salubrité par commune</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand-50 text-forest-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left font-medium">Commune</th>
                <th className="px-6 py-3 text-right font-medium">Population</th>
                <th className="px-6 py-3 text-right font-medium">Superficie (km²)</th>
                <th className="px-6 py-3 text-right font-medium">Indice éco</th>
                <th className="px-6 py-3 text-left font-medium w-32">Niveau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {communes.sort((a, b) => b.eco_score - a.eco_score).map((c) => (
                <tr key={c.id} className="hover:bg-sand-50">
                  <td className="px-6 py-3 font-medium text-forest-900">{c.name}</td>
                  <td className="px-6 py-3 text-right text-forest-600">{c.population.toLocaleString('fr')}</td>
                  <td className="px-6 py-3 text-right text-forest-600">{Number(c.area_km2).toFixed(1)}</td>
                  <td className="px-6 py-3 text-right font-display font-bold text-forest-700">{c.eco_score}/100</td>
                  <td className="px-6 py-3">
                    <div className="h-2 rounded-full bg-sand-200 overflow-hidden">
                      <div className="h-full gradient-forest" style={{ width: `${c.eco_score}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
