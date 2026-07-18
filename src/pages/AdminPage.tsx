import { useEffect, useState } from 'react';
import {
  Users, FileText, BookOpen, Shield, Activity, Trash2, CheckCircle2,
  XCircle, Edit, Search, AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  ROLE_LABELS, ROLE_COLORS, SIGNALEMENT_STATUS_LABELS, SIGNALEMENT_STATUS_COLORS,
  ARTICLE_CATEGORY_LABELS,
  type Profile, type Signalement, type Article, type AuditLog, type UserRole,
} from '../lib/supabase';
import { PageHeader, Card, LoadingState, StatCard, Modal } from '../components/ui';
import { classNames, timeAgo, formatDateTime } from '../lib/utils';
import { useAuth } from '../lib/auth';

type AdminTab = 'overview' | 'users' | 'signalements' | 'articles' | 'audit';

export function AdminPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<Profile[]>([]);
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState<Profile | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('citoyen');

  async function loadData() {
    const [usersRes, sigRes, artRes, auditRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('signalements').select('*, communes(name), profiles(full_name)').order('created_at', { ascending: false }).limit(100),
      supabase.from('articles').select('*, profiles(full_name)').order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(100),
    ]);
    setUsers((usersRes.data as Profile[]) ?? []);
    setSignalements((sigRes.data as Signalement[]) ?? []);
    setArticles((artRes.data as Article[]) ?? []);
    setAuditLogs((auditRes.data as AuditLog[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleRoleSave() {
    if (!editUser) return;
    await supabase.from('profiles').update({ role: editRole }).eq('id', editUser.id);
    await supabase.from('audit_logs').insert({ user_id: profile?.id, action: 'update_role', entity_type: 'profile', entity_id: editUser.id, details: { old_role: editUser.role, new_role: editRole } });
    setEditUser(null);
    loadData();
  }

  async function updateSignalementStatus(id: string, status: Signalement['status']) {
    const update: Partial<Signalement> = { status };
    if (status === 'resolu') update.resolved_at = new Date().toISOString();
    await supabase.from('signalements').update(update).eq('id', id);
    await supabase.from('audit_logs').insert({ user_id: profile?.id, action: 'update_status', entity_type: 'signalement', entity_id: id, details: { status } });
    loadData();
  }

  async function toggleArticlePublished(a: Article) {
    await supabase.from('articles').update({ published: !a.published }).eq('id', a.id);
    await supabase.from('audit_logs').insert({ user_id: profile?.id, action: 'toggle_publish', entity_type: 'article', entity_id: a.id, details: { published: !a.published } });
    loadData();
  }

  async function deleteArticle(id: string) {
    if (!confirm('Supprimer cet article ?')) return;
    await supabase.from('articles').delete().eq('id', id);
    await supabase.from('audit_logs').insert({ user_id: profile?.id, action: 'delete', entity_type: 'article', entity_id: id, details: {} });
    loadData();
  }

  const filteredUsers = users.filter((u) => u.full_name.toLowerCase().includes(search.toLowerCase()));
  const pendingSignalements = signalements.filter((s) => s.status === 'en_attente');
  const publishedArticles = articles.filter((a) => a.published);
  const draftArticles = articles.filter((a) => !a.published);

  const tabs: { key: AdminTab; label: string; icon: typeof Users; count?: number }[] = [
    { key: 'overview', label: 'Vue d\'ensemble', icon: Activity },
    { key: 'users', label: 'Utilisateurs', icon: Users, count: users.length },
    { key: 'signalements', label: 'Signalements', icon: FileText, count: pendingSignalements.length },
    { key: 'articles', label: 'Articles', icon: BookOpen, count: articles.length },
    { key: 'audit', label: 'Journal d\'audit', icon: Shield, count: auditLogs.length },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Administration" subtitle="Gestion complète de la plateforme KinshasaEco" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-sand-100 rounded-xl p-1 overflow-x-auto scrollbar-hide">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={classNames('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-all',
              tab === t.key ? 'bg-[#f7f6f1] text-forest-700 shadow-sm' : 'text-forest-500 hover:text-forest-700')}>
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.count !== undefined && <span className="ml-1 text-xs bg-forest-100 text-forest-600 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : tab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Utilisateurs" value={users.length} icon={<Users className="h-5 w-5" />} color="forest" />
            <StatCard label="Signalements en attente" value={pendingSignalements.length} icon={<AlertTriangle className="h-5 w-5" />} color="amber" />
            <StatCard label="Articles publiés" value={publishedArticles.length} icon={<BookOpen className="h-5 w-5" />} color="river" />
            <StatCard label="Brouillons" value={draftArticles.length} icon={<Edit className="h-5 w-5" />} color="earth" />
          </div>

          {/* Role distribution */}
          <Card className="p-6">
            <h3 className="font-display font-semibold text-forest-900 mb-4">Répartition par rôle</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => {
                const count = users.filter((u) => u.role === role).length;
                return (
                  <div key={role} className="text-center p-3 rounded-xl bg-sand-50">
                    <p className="font-display text-2xl font-bold text-forest-900">{count}</p>
                    <p className="text-xs text-forest-500 mt-1">{ROLE_LABELS[role]}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Recent signalements needing attention */}
          <Card className="overflow-hidden">
            <div className="px-6 py-4 border-b border-sand-200">
              <h3 className="font-display font-semibold text-forest-900">Signalements en attente de modération</h3>
            </div>
            {pendingSignalements.length === 0 ? (
              <div className="px-6 py-8 text-center text-forest-400 text-sm">Aucun signalement en attente.</div>
            ) : (
              <div className="divide-y divide-sand-100">
                {pendingSignalements.slice(0, 5).map((sig) => (
                  <div key={sig.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-forest-900 text-sm truncate">{sig.title}</p>
                      <p className="text-xs text-forest-400">{sig.profiles?.full_name} · {timeAgo(sig.created_at)}</p>
                    </div>
                    <button onClick={() => updateSignalementStatus(sig.id, 'en_cours')} className="btn-ghost text-xs"><CheckCircle2 className="h-4 w-4 text-forest-600" /> Valider</button>
                    <button onClick={() => updateSignalementStatus(sig.id, 'rejete')} className="btn-ghost text-xs"><XCircle className="h-4 w-4 text-red-500" /> Rejeter</button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : tab === 'users' ? (
        <>
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Rechercher un utilisateur…" />
          </div>
          <Card className="overflow-hidden">
            <div className="divide-y divide-sand-100">
              {filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-sand-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-700 font-semibold">
                    {u.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-forest-900 truncate">{u.full_name}</p>
                    <p className="text-xs text-forest-400">{u.points} points · {timeAgo(u.created_at)}</p>
                  </div>
                  <span className={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</span>
                  <button onClick={() => { setEditUser(u); setEditRole(u.role); }} className="btn-ghost text-sm">
                    <Edit className="h-4 w-4" /> Rôle
                  </button>
                </div>
              ))}
              {filteredUsers.length === 0 && <div className="px-5 py-8 text-center text-forest-400 text-sm">Aucun utilisateur trouvé.</div>}
            </div>
          </Card>
        </>
      ) : tab === 'signalements' ? (
        <Card className="overflow-hidden">
          <div className="divide-y divide-sand-100">
            {signalements.map((sig) => (
              <div key={sig.id} className="flex items-center gap-4 px-5 py-4 hover:bg-sand-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-forest-900 text-sm truncate">{sig.title}</p>
                  <p className="text-xs text-forest-400">{sig.profiles?.full_name} · {sig.communes?.name ?? 'N/A'} · {timeAgo(sig.created_at)}</p>
                </div>
                <span className={SIGNALEMENT_STATUS_COLORS[sig.status]}>{SIGNALEMENT_STATUS_LABELS[sig.status]}</span>
                <select value={sig.status} onChange={(e) => updateSignalementStatus(sig.id, e.target.value as Signalement['status'])} className="input w-36 text-sm py-1.5">
                  <option value="en_attente">En attente</option>
                  <option value="en_cours">En cours</option>
                  <option value="resolu">Résolu</option>
                  <option value="rejete">Rejeté</option>
                </select>
              </div>
            ))}
            {signalements.length === 0 && <div className="px-5 py-8 text-center text-forest-400 text-sm">Aucun signalement.</div>}
          </div>
        </Card>
      ) : tab === 'articles' ? (
        <Card className="overflow-hidden">
          <div className="divide-y divide-sand-100">
            {articles.map((a) => (
              <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-sand-50">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-forest-900 truncate">{a.title}</p>
                  <p className="text-xs text-forest-400">{a.profiles?.full_name} · {ARTICLE_CATEGORY_LABELS[a.category]} · {a.views} vues</p>
                </div>
                <span className={a.published ? 'badge-forest' : 'badge-sand'}>{a.published ? 'Publié' : 'Brouillon'}</span>
                <button onClick={() => toggleArticlePublished(a)} className="btn-ghost text-sm">
                  {a.published ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4 text-forest-600" />}
                  {a.published ? 'Dépublier' : 'Publier'}
                </button>
                <button onClick={() => deleteArticle(a.id)} className="btn-ghost text-sm text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {articles.length === 0 && <div className="px-5 py-8 text-center text-forest-400 text-sm">Aucun article.</div>}
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-sand-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sand-100 text-forest-500">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-forest-900">
                    <span className="font-semibold">{log.action}</span> sur <span className="text-forest-600">{log.entity_type}</span>
                  </p>
                  <p className="text-xs text-forest-400 mt-0.5">
                    {log.profiles?.full_name ?? 'Système'} · {formatDateTime(log.created_at)}
                    {log.entity_id && ` · ID: ${log.entity_id.slice(0, 8)}…`}
                  </p>
                  {Object.keys(log.details).length > 0 && (
                    <pre className="mt-1.5 text-xs text-forest-500 bg-sand-50 rounded-lg p-2 overflow-x-auto">{JSON.stringify(log.details, null, 2)}</pre>
                  )}
                </div>
              </div>
            ))}
            {auditLogs.length === 0 && <div className="px-5 py-8 text-center text-forest-400 text-sm">Aucune action enregistrée.</div>}
          </div>
        </Card>
      )}

      {/* Edit role modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Modifier le rôle">
        {editUser && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-forest-600">Utilisateur: <span className="font-semibold text-forest-900">{editUser.full_name}</span></p>
              <p className="text-xs text-forest-400 mt-0.5">Rôle actuel: {ROLE_LABELS[editUser.role]}</p>
            </div>
            <div>
              <label className="label">Nouveau rôle</label>
              <select value={editRole} onChange={(e) => setEditRole(e.target.value as UserRole)} className="input">
                {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <button onClick={handleRoleSave} className="btn-primary w-full">Enregistrer</button>
          </div>
        )}
      </Modal>
    </div>
  );
}
