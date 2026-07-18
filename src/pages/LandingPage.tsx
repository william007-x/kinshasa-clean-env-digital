import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf, MapPin, Trash2, BookOpen, Trophy, Users, ArrowRight,
  AlertTriangle, TrendingUp, ShieldCheck,
  Sprout, Map as MapIcon, Bell,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate, timeAgo, truncate } from '../lib/utils';
import { LoadingState } from '../components/ui';
import type { Signalement, Article, Commune } from '../lib/supabase';
import {
  SIGNALEMENT_TYPE_LABELS, SIGNALEMENT_STATUS_COLORS, SIGNALEMENT_STATUS_LABELS,
  ARTICLE_CATEGORY_LABELS,
} from '../lib/supabase';

export function LandingPage() {
  const [stats, setStats] = useState({ signalements: 0, resolved: 0, communes: 0, citizens: 0 });
  const [recentSignalements, setRecentSignalements] = useState<Signalement[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [topCommunes, setTopCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sigRes, resolvedRes, communesRes, profilesRes, articlesRes, topCommunesRes] = await Promise.all([
        supabase.from('signalements').select('*', { count: 'exact', head: true }),
        supabase.from('signalements').select('*', { count: 'exact', head: true }).eq('status', 'resolu'),
        supabase.from('communes').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('articles').select('*, profiles!inner(full_name)').eq('published', true).order('created_at', { ascending: false }).limit(3),
        supabase.from('communes').select('*').order('eco_score', { ascending: false }).limit(5),
      ]);

      const { data: recentSig } = await supabase
        .from('signalements')
        .select('*, communes(name)')
        .order('created_at', { ascending: false })
        .limit(4);

      setStats({
        signalements: sigRes.count ?? 0,
        resolved: resolvedRes.count ?? 0,
        communes: communesRes.count ?? 24,
        citizens: profilesRes.count ?? 0,
      });
      setRecentSignalements((recentSig as Signalement[]) ?? []);
      setRecentArticles((articlesRes.data as Article[]) ?? []);
      setTopCommunes((topCommunesRes.data as Commune[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(34,197,94,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(217,119,66,0.2) 0%, transparent 50%)' }} />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-1.5 text-sm font-medium mb-6">
                <Sprout className="h-4 w-4" />
                Pour une Kinshasa plus verte et durable
              </div>
              <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl text-balance">
                Ensemble, protégeons l'environnement de <span className="text-forest-300">Kinshasa</span>
              </h1>
              <p className="mt-6 text-lg text-sand-200 leading-relaxed max-w-xl">
                Signalez les incidents environnementaux, suivez les actions de collecte,
                éduquez-vous aux enjeux écologiques et contribuez à améliorer la salubrité
                de nos 24 communes.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/signalements/nouveau" className="btn bg-white text-forest-700 hover:bg-sand-100 focus:ring-white">
                  <AlertTriangle className="h-4 w-4" />
                  Signaler un incident
                </Link>
                <Link to="/carte" className="btn bg-white/10 backdrop-blur text-white border border-white/30 hover:bg-white/20 focus:ring-white">
                  <MapIcon className="h-4 w-4" />
                  Explorer la carte
                </Link>
              </div>
            </div>

            {/* Hero visual stats */}
            <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
              {[
                { label: 'Signalements', value: stats.signalements, icon: AlertTriangle, color: 'from-forest-400 to-forest-600' },
                { label: 'Résolus', value: stats.resolved, icon: ShieldCheck, color: 'from-emerald-400 to-emerald-600' },
                { label: 'Communes', value: stats.communes, icon: MapPin, color: 'from-earth-400 to-earth-600' },
                { label: 'Citoyens actifs', value: stats.citizens, icon: Users, color: 'from-river-400 to-river-600' },
              ].map((s, i) => (
                <div key={s.label} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 hover:bg-white/15 transition-all" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} mb-3`}>
                    <s.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-display text-3xl font-extrabold">{s.value.toLocaleString('fr')}</p>
                  <p className="text-sm text-sand-200 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Wave separator */}
        <div className="relative h-12 bg-sand-50" style={{ clipPath: 'polygon(0 100%, 100% 100%, 100% 0, 0 100%)', marginTop: '-1px' }} />
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="section-title">Une plateforme complète au service de l'environnement</h2>
          <p className="mt-3 text-forest-500 max-w-2xl mx-auto">
            Des outils pour les citoyens, les collecteurs, les ONG et les autorités publiques.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: AlertTriangle, title: 'Signalement citoyen', desc: 'Signalez dépôts sauvages, inondations, érosion et pollution avec photos et géolocalisation.', color: 'bg-earth-100 text-earth-700' },
            { icon: MapIcon, title: 'Carte interactive', desc: 'Visualisez tous les incidents et points de collecte sur une carte des 24 communes.', color: 'bg-river-100 text-river-700' },
            { icon: Trash2, title: 'Gestion des déchets', desc: 'Suivez les points de dépôt, les tournées de collecte et les quantités traitées.', color: 'bg-forest-100 text-forest-700' },
            { icon: BookOpen, title: 'Éducation écologique', desc: 'Articles, vidéos et campagnes pour sensibiliser la population aux enjeux.', color: 'bg-amber-100 text-amber-700' },
            { icon: Trophy, title: 'Gamification', desc: 'Gagnez des points, débloquez des badges et grimpez dans le classement.', color: 'bg-earth-100 text-earth-700' },
            { icon: TrendingUp, title: 'Statistiques', desc: 'Indicateurs de performance environnementale par commune et dans le temps.', color: 'bg-river-100 text-river-700' },
            { icon: Bell, title: 'Notifications', desc: 'Soyez alerté en temps réel du suivi de vos signalements et des campagnes.', color: 'bg-forest-100 text-forest-700' },
            { icon: ShieldCheck, title: 'Gouvernance', desc: 'Tableaux de bord et rapports pour les autorités publiques.', color: 'bg-red-100 text-red-700' },
          ].map((f) => (
            <div key={f.title} className="card p-6 hover:shadow-md transition-all hover:-translate-y-0.5 group">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.color} mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display font-semibold text-forest-900">{f.title}</h3>
              <p className="mt-2 text-sm text-forest-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent signalements */}
      <section className="bg-[#f7f6f1] border-y border-sand-300 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-title">Derniers signalements</h2>
              <p className="mt-2 text-forest-500">Les incidents les plus récents signalés par la communauté</p>
            </div>
            <Link to="/signalements" className="btn-ghost hidden sm:inline-flex">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loading ? (
            <LoadingState />
          ) : recentSignalements.length === 0 ? (
            <div className="card p-12 text-center">
              <AlertTriangle className="h-10 w-10 text-forest-300 mx-auto mb-3" />
              <p className="text-forest-500">Aucun signalement pour le moment. Soyez le premier à agir !</p>
              <Link to="/signalements/nouveau" className="btn-primary mt-4 inline-flex">
                Créer un signalement
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentSignalements.map((sig) => (
                <Link key={sig.id} to={`/signalements/${sig.id}`} className="card p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={SIGNALEMENT_STATUS_COLORS[sig.status]}>
                      {SIGNALEMENT_STATUS_LABELS[sig.status]}
                    </span>
                    <span className="text-xs text-forest-400">{timeAgo(sig.created_at)}</span>
                  </div>
                  <h3 className="font-display font-semibold text-forest-900 text-sm leading-snug">{sig.title}</h3>
                  <p className="mt-1.5 text-xs text-forest-500 line-clamp-2">{truncate(sig.description, 100)}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-forest-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {sig.communes?.name ?? 'Non localisé'}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs">
                    <span className="badge-sand">{SIGNALEMENT_TYPE_LABELS[sig.type]}</span>
                    <span className="flex items-center gap-1 text-forest-500"><TrendingUp className="h-3 w-3" />{sig.votes}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top communes + Education preview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Top communes */}
          <div>
            <h2 className="section-title mb-2">Classement des communes</h2>
            <p className="text-forest-500 mb-6">Les communes les plus éco-citoyennes ce mois-ci</p>
            <div className="card overflow-hidden">
              {topCommunes.length === 0 ? (
                <div className="p-8 text-center text-forest-400 text-sm">Chargement du classement…</div>
              ) : (
                topCommunes.map((c, i) => (
                  <div key={c.id} className={`flex items-center gap-4 px-5 py-4 ${i < topCommunes.length - 1 ? 'border-b border-sand-100' : ''}`}>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-display font-bold text-sm ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-sand-200 text-sand-700' : i === 2 ? 'bg-earth-100 text-earth-700' : 'bg-forest-50 text-forest-500'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-semibold text-forest-900">{c.name}</p>
                      <p className="text-xs text-forest-400">{c.population.toLocaleString('fr')} habitants</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-forest-700">{c.eco_score}/100</p>
                      <div className="mt-1 h-1.5 w-20 rounded-full bg-sand-200 overflow-hidden">
                        <div className="h-full rounded-full gradient-forest" style={{ width: `${c.eco_score}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
              <Link to="/classement" className="block px-5 py-3 text-center text-sm font-medium text-forest-600 hover:bg-forest-50 border-t border-sand-100">
                Voir le classement complet
              </Link>
            </div>
          </div>

          {/* Recent articles */}
          <div>
            <h2 className="section-title mb-2">Actualités & éducation</h2>
            <p className="text-forest-500 mb-6">Articles récents pour mieux comprendre les enjeux</p>
            {loading ? (
              <LoadingState />
            ) : recentArticles.length === 0 ? (
              <div className="card p-12 text-center">
                <BookOpen className="h-10 w-10 text-forest-300 mx-auto mb-3" />
                <p className="text-forest-500">Aucun article publié pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentArticles.map((a) => (
                  <Link key={a.id} to={`/education/${a.slug}`} className="card p-5 flex gap-4 hover:shadow-md transition-all">
                    {a.image_url ? (
                      <img src={a.image_url} alt="" className="h-20 w-20 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-forest-100 flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-forest-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="badge-forest mb-1.5">{ARTICLE_CATEGORY_LABELS[a.category]}</span>
                      <h3 className="font-display font-semibold text-forest-900 text-sm leading-snug">{a.title}</h3>
                      <p className="mt-1 text-xs text-forest-500 line-clamp-2">{a.excerpt ?? truncate(a.content, 120)}</p>
                      <p className="mt-1.5 text-xs text-forest-400">{formatDate(a.created_at)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative overflow-hidden rounded-3xl gradient-hero text-white p-10 sm:p-14 text-center">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(34,197,94,0.4) 0%, transparent 50%)' }} />
          <div className="relative">
            <Leaf className="h-12 w-12 mx-auto mb-4 text-forest-300" />
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl text-balance">
              Devenez un éco-citoyen actif
            </h2>
            <p className="mt-4 text-sand-200 max-w-2xl mx-auto">
              Inscrivez-vous gratuitement, signalez les problèmes environnementaux de votre quartier,
              et gagnez des récompenses tout en améliorant votre commune.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/inscription" className="btn bg-white text-forest-700 hover:bg-sand-100">
                Créer un compte
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/education" className="btn bg-white/10 backdrop-blur text-white border border-white/30 hover:bg-white/20">
                <BookOpen className="h-4 w-4" />
                Découvrir le centre éducatif
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
