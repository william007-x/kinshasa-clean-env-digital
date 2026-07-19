import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, Lock, User, MapPin, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { ROLE_LABELS, type UserRole } from '../lib/supabase';
import { classNames } from '../lib/utils';

const COMMUNE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Sélectionnez votre commune' },
  { value: 'bandalungwa', label: 'Bandalungwa' },
  { value: 'baramito', label: 'Baramito' },
  { value: 'binza', label: 'Binza' },
  { value: 'bumbu', label: 'Bumbu' },
  { value: 'gombe', label: 'Gombe' },
  { value: 'kalamu', label: 'Kalamu' },
  { value: 'kasa-vubu', label: 'Kasa-Vubu' },
  { value: 'kimbanseke', label: 'Kimbanseke' },
  { value: 'kinshasa', label: 'Kinshasa' },
  { value: 'kintambo', label: 'Kintambo' },
  { value: 'lemba', label: 'Lemba' },
  { value: 'limete', label: 'Limete' },
  { value: 'lingwala', label: 'Lingwala' },
  { value: 'makala', label: 'Makala' },
  { value: 'maluku', label: 'Maluku' },
  { value: 'masina', label: 'Masina' },
  { value: 'matete', label: 'Matete' },
  { value: 'mont-ngafula', label: 'Mont-Ngafula' },
  { value: 'ndjili', label: 'Ndjili' },
  { value: 'ngaba', label: 'Ngaba' },
  { value: 'ngaliema', label: 'Ngaliema' },
  { value: 'ngiri-ngiri', label: 'Ngiri-Ngiri' },
  { value: 'nsele', label: 'Nsele' },
  { value: 'selembao', label: 'Selembao' },
];

const ROLE_OPTIONS: { value: UserRole; desc: string }[] = [
  { value: 'citoyen', desc: 'Signalez et suivez les incidents' },
  { value: 'collecteur', desc: 'Gérez les tournées de collecte' },
  { value: 'ong', desc: 'Publiez des campagnes de sensibilisation' },
  { value: 'autorite', desc: 'Accédez aux tableaux de bord publics' },
];

function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 80%, rgba(34,197,94,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 20%, rgba(217,119,66,0.3) 0%, transparent 50%)' }} />
        <div className="relative flex flex-col justify-center px-16 text-white">
          <Link to="/" className="flex items-center gap-2.5 mb-12">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-xl font-extrabold">KinshasaEco</span>
          </Link>
          <h2 className="font-display text-4xl font-extrabold leading-tight mb-4 text-balance">
            La plateforme qui réunit tous les acteurs de l'environnement kinois.
          </h2>
          <ul className="space-y-3 text-sand-200">
            <li className="flex items-center gap-3"><Check className="h-5 w-5 text-forest-300" /> Signalez en temps réel les incidents environnementaux</li>
            <li className="flex items-center gap-3"><Check className="h-5 w-5 text-forest-300" /> Suivez la cartographie des 24 communes</li>
            <li className="flex items-center gap-3"><Check className="h-5 w-5 text-forest-300" /> Gagnez des badges et grimpez le classement</li>
            <li className="flex items-center gap-3"><Check className="h-5 w-5 text-forest-300" /> Accédez aux ressources éducatives</li>
          </ul>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-forest">
                <Leaf className="h-6 w-6 text-white" />
              </div>
              <span className="font-display text-xl font-extrabold text-forest-800">KinshasaEco</span>
            </Link>
          </div>
          <h1 className="font-display text-3xl font-bold text-forest-900">{title}</h1>
          <p className="mt-2 text-forest-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-forest-500">{footer}</div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error === 'Invalid login credentials' ? 'Email ou mot de passe incorrect.' : error);
    } else {
      window.location.href = '/dashboard';
    }
  }

  return (
    <AuthShell
      title="Connexion"
      subtitle="Accédez à votre tableau de bord écologique"
      footer={<>Pas encore de compte ? <Link to="/inscription" className="font-semibold text-forest-600 hover:text-forest-700">Créer un compte</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="vous@exemple.com" />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0" htmlFor="password">Mot de passe</label>
            <Link to="/mot-de-passe-oublie" className="text-xs font-medium text-forest-600 hover:text-forest-700">Mot de passe oublié ?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="••••••••" />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Connexion…' : 'Se connecter'}
          {!loading && <ChevronRight className="h-4 w-4" />}
        </button>
      </form>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('citoyen');
  const [communeCode, setCommuneCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role, communeCode);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <AuthShell
        title="Compte créé"
        subtitle="Votre inscription est confirmée"
        footer={<Link to="/connexion" className="font-semibold text-forest-600">Aller à la connexion</Link>}
      >
        <div className="rounded-2xl bg-forest-50 border border-forest-200 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-100 text-forest-600 mb-4">
            <Check className="h-7 w-7" />
          </div>
          <h3 className="font-display font-semibold text-forest-900">Bienvenue, {fullName} !</h3>
          <p className="mt-2 text-sm text-forest-600">
            Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter
            et commencer à contribuer à la protection de l'environnement de Kinshasa.
          </p>
          <Link to="/connexion" className="btn-primary mt-5 inline-flex">
            Se connecter <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Rejoignez la communauté éco-citoyenne de Kinshasa"
      footer={<>Déjà inscrit ? <Link to="/connexion" className="font-semibold text-forest-600 hover:text-forest-700">Se connecter</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div>
          <label className="label" htmlFor="fullName">Nom complet</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
            <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input pl-10" placeholder="Jean Mukendi" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="vous@exemple.com" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="password">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
              <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10" placeholder="••••••" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirmer</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
              <input id="confirm" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input pl-10" placeholder="••••••" />
            </div>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="commune">Commune</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
            <select id="commune" value={communeCode} onChange={(e) => setCommuneCode(e.target.value)} className="input pl-10">
              {COMMUNE_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Votre rôle</label>
          <div className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={classNames(
                  'rounded-xl border px-3 py-2.5 text-left transition-colors',
                  role === r.value ? 'border-forest-500 bg-forest-50 ring-2 ring-forest-200' : 'border-sand-300 hover:border-forest-300'
                )}
              >
                <p className="text-sm font-semibold text-forest-900">{ROLE_LABELS[r.value]}</p>
                <p className="text-xs text-forest-500 mt-0.5">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Création…' : 'Créer mon compte'}
          {!loading && <ChevronRight className="h-4 w-4" />}
        </button>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/connexion`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Recevez un lien de réinitialisation par email"
      footer={<>Retour à la <Link to="/connexion" className="font-semibold text-forest-600">connexion</Link></>}
    >
      {sent ? (
        <div className="rounded-2xl bg-forest-50 border border-forest-200 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-100 text-forest-600 mb-4">
            <Mail className="h-7 w-7" />
          </div>
          <h3 className="font-display font-semibold text-forest-900">Email envoyé</h3>
          <p className="mt-2 text-sm text-forest-600">
            Si un compte existe pour {email}, vous recevrez un lien de réinitialisation.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="vous@exemple.com" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Envoi…' : 'Envoyer le lien'}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
