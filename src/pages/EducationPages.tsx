import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, ArrowRight, Calendar, Users, Target, Search,
  Megaphone, TrendingUp, Eye, Tag,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  ARTICLE_CATEGORY_LABELS, type Article, type ArticleCategory, type Campagne,
} from '../lib/supabase';
import { PageHeader, Card, LoadingState, EmptyState, StatCard } from '../components/ui';
import { classNames, formatDate, truncate, } from '../lib/utils';

export function EducationPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<ArticleCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('articles')
        .select('*, profiles(full_name)')
        .eq('published', true)
        .order('created_at', { ascending: false });
      setArticles((data as Article[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = articles.filter((a) => {
    if (category !== 'all' && a.category !== category) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const categories = Object.entries(ARTICLE_CATEGORY_LABELS) as [ArticleCategory, string][];

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Centre éducatif" subtitle="Articles, guides et ressources pour comprendre les enjeux environnementaux de Kinshasa" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Articles publiés" value={articles.length} icon={<BookOpen className="h-5 w-5" />} color="forest" />
        <StatCard label="Catégories" value={categories.length} icon={<Tag className="h-5 w-5" />} color="earth" />
        <StatCard label="Vues totales" value={articles.reduce((s, a) => s + a.views, 0)} icon={<Eye className="h-5 w-5" />} color="river" />
        <StatCard label="Auteurs" value={new Set(articles.map((a) => a.author_id)).size} icon={<Users className="h-5 w-5" />} color="amber" />
      </div>

      {/* Search + filter */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Rechercher un article…" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCategory('all')} className={classNames('badge px-3 py-1.5', category === 'all' ? 'bg-forest-600 text-white' : 'badge-sand')}>Tous</button>
            {categories.map(([val, label]) => (
              <button key={val} onClick={() => setCategory(val)} className={classNames('badge px-3 py-1.5', category === val ? 'bg-forest-600 text-white' : 'badge-sand')}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="Aucun article"
          description="Les articles éducatifs apparaîtront ici une fois publiés."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((a) => (
            <Link key={a.id} to={`/education/${a.slug}`} className="card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 group">
              {a.image_url ? (
                <div className="aspect-video overflow-hidden bg-sand-100">
                  <img src={a.image_url} alt={a.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
              ) : (
                <div className="aspect-video flex items-center justify-center gradient-forest">
                  <BookOpen className="h-12 w-12 text-white/60" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge-forest">{ARTICLE_CATEGORY_LABELS[a.category]}</span>
                  <span className="text-xs text-forest-400">{formatDate(a.created_at)}</span>
                </div>
                <h3 className="font-display font-semibold text-forest-900 leading-snug group-hover:text-forest-700">{a.title}</h3>
                <p className="mt-2 text-sm text-forest-500 line-clamp-2">{a.excerpt ?? truncate(a.content, 120)}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-forest-400">
                  <span>{a.profiles?.full_name ?? 'Anonyme'}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{a.views}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ArticleDetailPage() {
  const { slug } = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from('articles')
        .select('*, profiles(full_name, role)')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();
      if (data) {
        setArticle(data as Article);
        await supabase.from('articles').update({ views: data.views + 1 }).eq('id', data.id);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8"><LoadingState /></div>;
  if (!article) return <div className="mx-auto max-w-3xl px-4 py-8"><EmptyState icon={<BookOpen className="h-12 w-12" />} title="Article introuvable" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Link to="/education" className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-600 hover:text-forest-700 mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour au centre éducatif
      </Link>

      {article.image_url && (
        <div className="aspect-video rounded-2xl overflow-hidden mb-6 bg-sand-100">
          <img src={article.image_url} alt={article.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <span className="badge-forest">{ARTICLE_CATEGORY_LABELS[article.category]}</span>
        <span className="text-sm text-forest-400">{formatDate(article.created_at)}</span>
        <span className="flex items-center gap-1 text-sm text-forest-400"><Eye className="h-3.5 w-3.5" />{article.views} vues</span>
      </div>

      <h1 className="font-display text-3xl font-bold text-forest-900 mb-4 leading-tight">{article.title}</h1>

      <div className="flex items-center gap-3 pb-6 mb-6 border-b border-sand-200">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-700 font-semibold">
          {article.profiles?.full_name?.charAt(0).toUpperCase() ?? 'A'}
        </div>
        <div>
          <p className="font-medium text-forest-900">{article.profiles?.full_name ?? 'Anonyme'}</p>
          <p className="text-xs text-forest-400">Auteur</p>
        </div>
      </div>

      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {article.tags.map((t) => <span key={t} className="badge-sand"><Tag className="h-3 w-3" />{t}</span>)}
        </div>
      )}

      <div className="prose prose-forest max-w-none">
        <p className="text-forest-700 leading-relaxed whitespace-pre-wrap text-lg">{article.content}</p>
      </div>
    </div>
  );
}

export function CampagnesPage() {
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('campagnes')
        .select('*, communes(name)')
        .order('start_date', { ascending: false });
      setCampagnes((data as Campagne[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const active = campagnes.filter((c) => c.status === 'active' || c.status === 'a_venir');
  const past = campagnes.filter((c) => c.status === 'terminee');

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Campagnes de sensibilisation" subtitle="Initiatives et mobilisations environnementales à Kinshasa" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Campagnes actives" value={active.length} icon={<Megaphone className="h-5 w-5" />} color="earth" />
        <StatCard label="Participants totaux" value={campagnes.reduce((s, c) => s + c.participants_count, 0)} icon={<Users className="h-5 w-5" />} color="forest" />
        <StatCard label="Campagnes terminées" value={past.length} icon={<Target className="h-5 w-5" />} color="river" />
      </div>

      {loading ? (
        <LoadingState />
      ) : campagnes.length === 0 ? (
        <EmptyState icon={<Megaphone className="h-12 w-12" />} title="Aucune campagne" description="Les campagnes de sensibilisation apparaîtront ici." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {campagnes.map((c) => {
            const statusLabels = { a_venir: 'À venir', active: 'Active', terminee: 'Terminée', annulee: 'Annulée' };
            const statusColors = { a_venir: 'badge-amber', active: 'badge-forest', terminee: 'badge-sand', annulee: 'badge-red' };
            const daysLeft = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <Card key={c.id} className="overflow-hidden hover:shadow-md transition-all">
                {c.image_url ? (
                  <div className="aspect-video overflow-hidden bg-sand-100">
                    <img src={c.image_url} alt={c.title} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video gradient-earth flex items-center justify-center">
                    <Megaphone className="h-12 w-12 text-white/60" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={statusColors[c.status]}>{statusLabels[c.status]}</span>
                    {c.status === 'active' && daysLeft > 0 && <span className="text-xs text-forest-500">{daysLeft} jours restants</span>}
                  </div>
                  <h3 className="font-display font-semibold text-forest-900">{c.title}</h3>
                  <p className="mt-2 text-sm text-forest-500 line-clamp-2">{c.description}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-forest-400">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(c.start_date)} → {formatDate(c.end_date)}</span>
                    {c.communes && <span className="flex items-center gap-1"><Target className="h-3 w-3" />{c.communes.name}</span>}
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.participants_count} participants</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ActualitesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('articles')
        .select('*, profiles(full_name)')
        .eq('published', true)
        .eq('category', 'actualite')
        .order('created_at', { ascending: false });
      setArticles((data as Article[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Actualités" subtitle="Dernières nouvelles environnementales de Kinshasa" />
      {loading ? (
        <LoadingState />
      ) : articles.length === 0 ? (
        <EmptyState icon={<TrendingUp className="h-12 w-12" />} title="Aucune actualité" description="Les dernières actualités apparaîtront ici." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((a) => (
            <Link key={a.id} to={`/education/${a.slug}`} className="card overflow-hidden hover:shadow-md transition-all group">
              {a.image_url && (
                <div className="aspect-video overflow-hidden bg-sand-100">
                  <img src={a.image_url} alt={a.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              )}
              <div className="p-5">
                <span className="text-xs text-forest-400">{formatDate(a.created_at)}</span>
                <h3 className="font-display font-semibold text-forest-900 mt-1 leading-snug">{a.title}</h3>
                <p className="mt-2 text-sm text-forest-500 line-clamp-2">{a.excerpt ?? truncate(a.content, 120)}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-forest-600">Lire <ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
