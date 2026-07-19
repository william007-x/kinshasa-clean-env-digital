import { useEffect, useState } from 'react';
import {
  Award, Star, Crown, Flame, Shield, Eye, Recycle, BookOpen,
  Megaphone, ThumbsUp, Medal, Users, MapPin,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  type Badge, type UserBadge, type Profile, type Commune,
  LEVEL_LABELS, getLevelFromPoints,
} from '../lib/supabase';
import { PageHeader, Card, LoadingState, EmptyState, ProgressBar } from '../components/ui';
import { classNames } from '../lib/utils';

const BADGE_ICONS: Record<string, typeof Award> = {
  award: Award,
  eye: Eye,
  shield: Shield,
  droplet: Shield,
  recycle: Recycle,
  'book-open': BookOpen,
  megaphone: Megaphone,
  star: Star,
  flame: Flame,
  crown: Crown,
  'thumbs-up': ThumbsUp,
};

const LEVEL_ICONS = {
  debutant: Medal,
  actif: Star,
  militant: Flame,
  ambassadeur: Crown,
};

const LEVEL_COLORS = {
  debutant: 'from-sand-300 to-sand-500',
  actif: 'from-forest-400 to-forest-600',
  militant: 'from-earth-400 to-earth-600',
  ambassadeur: 'from-amber-400 to-amber-600',
};

export function ClassementPage() {
  const [tab, setTab] = useState<'citoyens' | 'communes'>('citoyens');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<Record<string, UserBadge[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [profRes, comRes, badgeRes] = await Promise.all([
        supabase.from('profiles').select('*').order('points', { ascending: false }).limit(50),
        supabase.from('communes').select('*').order('eco_score', { ascending: false }),
        supabase.from('badges').select('*').order('criteria_value'),
      ]);
      setProfiles((profRes.data as Profile[]) ?? []);
      setCommunes((comRes.data as Commune[]) ?? []);
      setBadges((badgeRes.data as Badge[]) ?? []);

      if (profRes.data && profRes.data.length > 0) {
        const userIds = profRes.data.map((p) => p.id);
        const { data: ubData } = await supabase.from('user_badges').select('*, badges(*)').in('user_id', userIds);
        const ubMap: Record<string, UserBadge[]> = {};
        (ubData as UserBadge[])?.forEach((ub) => {
          if (!ubMap[ub.user_id]) ubMap[ub.user_id] = [];
          ubMap[ub.user_id].push(ub);
        });
        setUserBadges(ubMap);
      }
      setLoading(false);
    })();
  }, []);

  const podium = profiles.slice(0, 3);
  const restCitoyens = profiles.slice(3);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Classement" subtitle="Les éco-citoyens et communes les plus actifs de Kinshasa" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-sand-100 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('citoyens')} className={classNames('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium', tab === 'citoyens' ? 'bg-[#f7f6f1] text-forest-700 shadow-sm' : 'text-forest-500')}>
          <Users className="h-4 w-4" /> Citoyens
        </button>
        <button onClick={() => setTab('communes')} className={classNames('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium', tab === 'communes' ? 'bg-[#f7f6f1] text-forest-700 shadow-sm' : 'text-forest-500')}>
          <MapPin className="h-4 w-4" /> Communes
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : tab === 'citoyens' ? (
        <>
          {/* Podium */}
          {podium.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
              {[1, 0, 2].map((idx) => {
                const p = podium[idx];
                if (!p) return <div key={idx} />;
                const height = idx === 0 ? 'h-40' : 'h-32';
                const colors = LEVEL_COLORS[getLevelFromPoints(p.points)];
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={p.id} className="flex flex-col items-center">
                    <div className={classNames('flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white text-2xl font-display font-extrabold mb-2', colors)}>
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-semibold text-forest-900 text-sm text-center truncate max-w-full">{p.full_name}</p>
                    <p className="text-xs text-forest-500">{p.points} pts</p>
                    <div className={classNames('w-full rounded-t-xl bg-gradient-to-b ${colors} flex items-start justify-center pt-2 text-3xl', height)} style={{ background: idx === 0 ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)' : idx === 1 ? 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)' : 'linear-gradient(180deg, #d97742 0%, #a64a30 100%)' }}>
                      <span className="mt-1">{medals[idx]}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of ranking */}
          {restCitoyens.length > 0 && (
            <Card className="overflow-hidden">
              <div className="divide-y divide-sand-100">
                {restCitoyens.map((p, i) => {
                  const level = getLevelFromPoints(p.points);
                  const LevelIcon = LEVEL_ICONS[level];
                  const userBadgesList = userBadges[p.id] ?? [];
                  return (
                    <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-sand-50 transition-colors">
                      <span className="font-display font-bold text-forest-400 text-sm w-6 text-center">{i + 4}</span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-700 font-semibold">
                        {p.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-forest-900 truncate">{p.full_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={classNames('flex items-center gap-1 text-xs', level === 'ambassadeur' ? 'text-amber-600' : level === 'militant' ? 'text-earth-600' : level === 'actif' ? 'text-forest-600' : 'text-forest-400')}>
                            <LevelIcon className="h-3 w-3" />
                            {LEVEL_LABELS[level]}
                          </span>
                          {userBadgesList.length > 0 && (
                            <span className="flex items-center gap-1 text-xs text-forest-500">
                              <Award className="h-3 w-3" />{userBadgesList.length} badges
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-forest-900">{p.points}</p>
                        <p className="text-xs text-forest-400">points</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
          {profiles.length === 0 && <EmptyState icon={<Users className="h-12 w-12" />} title="Aucun citoyen actif" description="Inscrivez-vous et soyez le premier du classement !" />}
        </>
      ) : (
        <>
          {communes.length > 0 && (
            <>
              {/* Top 3 communes */}
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {communes.slice(0, 3).map((c, i) => (
                  <Card key={c.id} className={classNames('p-6 text-center', i === 0 ? 'ring-2 ring-amber-400' : '')}>
                    <div className={classNames('mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-3 text-2xl', i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-sand-200 text-sand-700' : 'bg-earth-100 text-earth-700')}>
                      {i === 0 ? <Crown className="h-7 w-7" /> : i === 1 ? <Medal className="h-7 w-7" /> : <Award className="h-7 w-7" />}
                    </div>
                    <h3 className="font-display font-bold text-forest-900">{c.name}</h3>
                    <p className="font-display text-3xl font-extrabold text-forest-700 mt-2">{c.eco_score}<span className="text-base text-forest-400">/100</span></p>
                    <div className="mt-3"><ProgressBar value={c.eco_score} /></div>
                    <p className="text-xs text-forest-400 mt-2">{c.population.toLocaleString('fr')} habitants</p>
                  </Card>
                ))}
              </div>

              {/* Full ranking */}
              <Card className="overflow-hidden">
                <div className="divide-y divide-sand-100">
                  {communes.slice(3).map((c, i) => (
                    <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-sand-50 transition-colors">
                      <span className="font-display font-bold text-forest-400 text-sm w-6 text-center">{i + 4}</span>
                      <div className="flex-1">
                        <p className="font-medium text-forest-900">{c.name}</p>
                        <p className="text-xs text-forest-400">{c.population.toLocaleString('fr')} habitants · {Number(c.area_km2).toFixed(1)} km²</p>
                      </div>
                      <div className="w-32">
                        <ProgressBar value={c.eco_score} />
                      </div>
                      <span className="font-display font-bold text-forest-700 w-12 text-right">{c.eco_score}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* Badges section */}
      {badges.length > 0 && (
        <div className="mt-12">
          <h2 className="section-title mb-2">Badges éco-citoyens</h2>
          <p className="text-forest-500 mb-6">Débloquez ces récompenses en contribuant à la plateforme</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {badges.map((b) => {
              const Icon = BADGE_ICONS[b.icon] ?? Award;
              return (
                <Card key={b.id} className="p-5 text-center hover:shadow-md transition-shadow">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 text-white mb-3">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display font-semibold text-forest-900 text-sm">{b.name}</h3>
                  <p className="mt-1.5 text-xs text-forest-500">{b.description}</p>
                  <p className="mt-2 text-xs font-medium text-forest-600">{b.criteria_value} {b.criteria_type === 'points' ? 'points requis' : b.criteria_type === 'signalements' ? 'signalements' : b.criteria_type === 'articles' ? 'articles' : b.criteria_type === 'campagnes' ? 'campagnes' : 'votes'}</p>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
