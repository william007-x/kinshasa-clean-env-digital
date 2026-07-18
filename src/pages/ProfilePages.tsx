import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Mail, Phone, Award, Trophy, AlertTriangle,
  Bell, Check, Shield, ChevronRight, Save,
  Eye, EyeOff, Lock,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  ROLE_LABELS, ROLE_COLORS, LEVEL_LABELS, getLevelFromPoints,
  type Signalement, type UserBadge, type Notification,
} from '../lib/supabase';
import { PageHeader, Card, LoadingState, EmptyState, ErrorState, StatCard } from '../components/ui';
import { classNames, timeAgo, formatDate } from '../lib/utils';

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [sigRes, badgeRes] = await Promise.all([
        supabase.from('signalements').select('*, communes(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('user_badges').select('*, badges(*)').eq('user_id', user.id).order('earned_at', { ascending: false }),
      ]);
      setSignalements((sigRes.data as Signalement[]) ?? []);
      setBadges((badgeRes.data as UserBadge[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  function startEdit() {
    setFullName(profile?.full_name ?? '');
    setBio(profile?.bio ?? '');
    setPhone(profile?.phone ?? '');
    setEditing(true);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, bio, phone, updated_at: new Date().toISOString() }).eq('id', user.id);
    setSaving(false);
    if (error) { setError(error.message); return; }
    await refreshProfile();
    setEditing(false);
  }

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-8"><LoadingState /></div>;

  const level = getLevelFromPoints(profile?.points ?? 0);
  const resolvedCount = signalements.filter((s) => s.status === 'resolu').length;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Mon profil" subtitle="Gérez vos informations et consultez votre activité" />

      {/* Profile header card */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl gradient-forest text-white font-display text-3xl font-extrabold flex-shrink-0">
            {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                {error && <ErrorState message={error} />}
                <div>
                  <label className="label">Nom complet</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Téléphone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="+243…" />
                </div>
                <div>
                  <label className="label">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input resize-none" placeholder="Parlez de vous…" />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving} className="btn-primary"><Save className="h-4 w-4" /> {saving ? 'Sauvegarde…' : 'Enregistrer'}</button>
                  <button onClick={() => setEditing(false)} className="btn-secondary">Annuler</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-forest-900">{profile?.full_name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className={ROLE_COLORS[profile?.role ?? 'citoyen']}>{ROLE_LABELS[profile?.role ?? 'citoyen']}</span>
                  <span className="badge-amber">{LEVEL_LABELS[level]}</span>
                </div>
                {profile?.bio && <p className="mt-3 text-sm text-forest-600">{profile.bio}</p>}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-forest-500">
                  {profile?.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{profile.phone}</span>}
                  {user?.email && <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{user.email}</span>}
                </div>
                <button onClick={startEdit} className="btn-secondary mt-4 text-sm">
                  <User className="h-4 w-4" /> Modifier le profil
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Points" value={profile?.points ?? 0} icon={<Trophy className="h-5 w-5" />} color="amber" />
        <StatCard label="Signalements" value={signalements.length} icon={<AlertTriangle className="h-5 w-5" />} color="earth" />
        <StatCard label="Résolus" value={resolvedCount} icon={<Check className="h-5 w-5" />} color="forest" />
        <StatCard label="Badges" value={badges.length} icon={<Award className="h-5 w-5" />} color="river" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Badges */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" /> Mes badges
          </h3>
          {badges.length === 0 ? (
            <p className="text-sm text-forest-400 py-4 text-center">Aucun badge pour le moment. Continuez à contribuer !</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {badges.map((ub) => (
                <div key={ub.id} className="flex items-center gap-3 p-3 rounded-xl bg-sand-50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 text-white">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-forest-900 text-sm truncate">{ub.badges?.name}</p>
                    <p className="text-xs text-forest-400">{formatDate(ub.earned_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent activity */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-sand-200">
            <h3 className="font-display font-semibold text-forest-900">Mes signalements récents</h3>
          </div>
          {signalements.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <AlertTriangle className="h-8 w-8 text-forest-300 mx-auto mb-2" />
              <p className="text-sm text-forest-400 mb-3">Aucun signalement.</p>
              <Link to="/signalements/nouveau" className="btn-primary text-sm">Créer un signalement</Link>
            </div>
          ) : (
            <div className="divide-y divide-sand-100 max-h-80 overflow-y-auto">
              {signalements.slice(0, 8).map((sig) => (
                <Link key={sig.id} to={`/signalements/${sig.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-sand-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-forest-900 truncate">{sig.title}</p>
                    <p className="text-xs text-forest-400">{timeAgo(sig.created_at)}</p>
                  </div>
                  <span className={classNames(sig.status === 'resolu' ? 'badge-forest' : sig.status === 'en_attente' ? 'badge-amber' : sig.status === 'en_cours' ? 'badge-river' : 'badge-red')}>
                    {sig.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setNotifications((data as Notification[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 py-8"><LoadingState /></div>;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Notifications" subtitle="Toutes vos notifications" />
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-12 w-12" />} title="Aucune notification" description="Vous serez notifié des mises à jour de vos signalements et des nouvelles campagnes." />
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-sand-100">
            {notifications.map((n) => (
              <div key={n.id} className={classNames('flex items-start gap-3 px-5 py-4', !n.read && 'bg-forest-50/50')}>
                <div className={classNames('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl',
                  n.type === 'success' ? 'bg-forest-100 text-forest-600' : n.type === 'warning' ? 'bg-amber-100 text-amber-600' : n.type === 'error' ? 'bg-red-100 text-red-600' : n.type === 'badge' ? 'bg-amber-100 text-amber-600' : 'bg-river-100 text-river-600')}>
                  {n.type === 'badge' ? <Award className="h-4 w-4" /> : n.type === 'signalement' ? <AlertTriangle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={classNames('text-sm', !n.read ? 'font-semibold text-forest-900' : 'text-forest-700')}>{n.title}</p>
                  <p className="text-xs text-forest-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-forest-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && <button onClick={() => markRead(n.id)} className="text-xs font-medium text-forest-600 hover:text-forest-700">Marquer lu</button>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères.'); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setMessage('Mot de passe mis à jour avec succès.');
    setNewPassword('');
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Paramètres" subtitle="Gérez la sécurité de votre compte" />

      <div className="space-y-6">
        {/* Account info */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-forest-600" /> Informations du compte
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-sand-100">
              <span className="text-forest-500">Email</span>
              <span className="font-medium text-forest-900">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-sand-100">
              <span className="text-forest-500">ID utilisateur</span>
              <span className="font-mono text-xs text-forest-700">{user?.id.slice(0, 12)}…</span>
            </div>
            <Link to="/profile" className="flex items-center justify-between py-2 text-forest-600 hover:text-forest-700">
              <span>Modifier le profil</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>

        {/* Password change */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-forest-600" /> Changer le mot de passe
          </h3>
          {message && <div className="rounded-xl bg-forest-50 border border-forest-200 px-4 py-3 text-sm text-forest-700 mb-4">{message}</div>}
          {error && <ErrorState message={error} />}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="label" htmlFor="new-pwd">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
                <input id="new-pwd" type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input pl-10 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Mise à jour…' : 'Mettre à jour'}</button>
          </form>
        </Card>

        {/* Privacy */}
        <Card className="p-6">
          <h3 className="font-display font-semibold text-forest-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-forest-600" /> Confidentialité et sécurité
          </h3>
          <div className="space-y-3 text-sm text-forest-600">
            <p>Vos données sont protégées par les politiques de sécurité Supabase (RLS — Row Level Security).</p>
            <p>Seules les informations que vous publiez (signalements, commentaires) sont visibles par les autres utilisateurs.</p>
            <Link to="/confidentialite" className="block text-forest-600 hover:text-forest-700 font-medium mt-3">Lire la politique de confidentialité →</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
