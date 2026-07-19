import { type ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Leaf, Menu, X, Bell, User as UserIcon, LogOut, ChevronDown,
  LayoutDashboard, MapPin, Trash2, BookOpen, BarChart3, Settings,
  Shield, Trophy, Home, FileText, HelpCircle, Users, Info,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { ROLE_LABELS, ROLE_COLORS, LEVEL_LABELS } from '../lib/supabase';
import type { UserRole } from '../lib/supabase';
import { classNames } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { Notification } from '../lib/supabase';

const NAV_LINKS = [
  { to: '/', label: 'Accueil', icon: Home, public: true },
  { to: '/carte', label: 'Carte', icon: MapPin, public: true },
  { to: '/education', label: 'Éducation', icon: BookOpen, public: true },
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard, auth: true },
  { to: '/signalements', label: 'Signalements', icon: FileText, auth: true },
  { to: '/dechets', label: 'Déchets', icon: Trash2, auth: true },
  { to: '/statistiques', label: 'Statistiques', icon: BarChart3, roles: ['autorite','admin'] as UserRole[] },
  { to: '/classement', label: 'Classement', icon: Trophy, auth: true },
  { to: '/a-propos', label: 'À propos', icon: Info, public: true },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Administration', icon: Shield },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) {
        setNotifications(data as Notification[]);
        setUnreadCount(data.filter((n) => !n.read).length);
      }
    })();
  }, [user, location.pathname]);

  const isAdmin = profile?.role === 'admin';
  const visibleNavLinks = NAV_LINKS.filter((l) => {
    if (l.roles) return user && profile && l.roles.includes(profile.role);
    return l.public || (l.auth && user);
  });

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  async function markAllRead() {
    if (!user) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="min-h-screen flex flex-col bg-sand-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-sand-200/60 glass">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-forest text-white shadow-sm group-hover:shadow-md transition-shadow">
                <Leaf className="h-5 w-5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-lg font-extrabold text-forest-800">KinshasaEco</span>
                <span className="text-[10px] font-medium text-forest-500 tracking-wide">PLATEFORME ÉCOLOGIQUE</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {visibleNavLinks.map((link) => {
                const active = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={classNames(
                      'px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                      active ? 'bg-forest-100 text-forest-700' : 'text-forest-600 hover:bg-forest-50 hover:text-forest-800'
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {isAdmin && ADMIN_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={classNames(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                    location.pathname.startsWith(link.to) ? 'bg-red-100 text-red-700' : 'text-red-600 hover:bg-red-50'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Notifications */}
                  <div className="relative">
                    <button
                      onClick={() => { setNotifOpen((o) => !o); if (!notifOpen) markAllRead(); }}
                      className="relative flex h-10 w-10 items-center justify-center rounded-xl text-forest-600 hover:bg-forest-50 transition-colors"
                      aria-label="Notifications"
                    >
                      <Bell className="h-5 w-5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white animate-pulse-soft">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                    {notifOpen && (
                      <div className="absolute -right-12 sm:right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#f7f6f1] shadow-xl border border-sand-300 animate-slide-in-right overflow-hidden">
                        <div className="px-4 py-3 border-b border-sand-200">
                          <p className="font-display font-semibold text-forest-900">Notifications</p>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-sm text-forest-400">
                              <Bell className="h-6 w-6 mx-auto mb-2 text-forest-300" />
                              Aucune notification
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <div key={n.id} className="px-4 py-3 border-b border-sand-100 hover:bg-sand-50 transition-colors">
                                <div className="flex items-start gap-2">
                                  {!n.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-forest-500" />}
                                  <div className={classNames(!n.read && 'pl-4 -ml-4')}>
                                    <p className="text-sm font-medium text-forest-900">{n.title}</p>
                                    <p className="text-xs text-forest-500 mt-0.5">{n.message}</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <Link to="/notifications" className="block px-4 py-3 text-center text-sm font-medium text-forest-600 hover:bg-forest-50">
                          Voir tout
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Profile dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen((o) => !o)}
                      className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-forest-50 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-100 text-forest-700 font-semibold text-sm">
                        {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                      </div>
                      <ChevronDown className="h-4 w-4 text-forest-400 hidden sm:block" />
                    </button>
                    {profileOpen && (
                      <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#f7f6f1] shadow-xl border border-sand-300 animate-slide-in-right overflow-hidden">
                        <div className="px-4 py-4 border-b border-sand-200">
                          <p className="font-semibold text-forest-900">{profile?.full_name}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className={classNames(ROLE_COLORS[profile?.role ?? 'citoyen'])}>
                              {ROLE_LABELS[profile?.role ?? 'citoyen']}
                            </span>
                            <span className="badge-sand">{LEVEL_LABELS[profile?.level ?? 'debutant']}</span>
                          </div>
                          <div className="mt-2 text-xs text-forest-500">{profile?.points} points éco-citoyens</div>
                        </div>
                        <div className="py-1.5">
                          <Link to="/profile" className="flex items-center gap-3 px-4 py-2.5 text-sm text-forest-700 hover:bg-sand-50">
                            <UserIcon className="h-4 w-4 text-forest-400" /> Mon profil
                          </Link>
                          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-forest-700 hover:bg-sand-50">
                            <LayoutDashboard className="h-4 w-4 text-forest-400" /> Tableau de bord
                          </Link>
                          <Link to="/parametres" className="flex items-center gap-3 px-4 py-2.5 text-sm text-forest-700 hover:bg-sand-50">
                            <Settings className="h-4 w-4 text-forest-400" /> Paramètres
                          </Link>
                          <button onClick={handleSignOut} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                            <LogOut className="h-4 w-4" /> Déconnexion
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/connexion" className="btn-ghost">Connexion</Link>
                  <Link to="/inscription" className="btn-primary">S'inscrire</Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen((o) => !o)}
                className="lg:hidden flex h-10 w-10 items-center justify-center rounded-xl text-forest-600 hover:bg-forest-50"
                aria-label="Menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <nav className="lg:hidden border-t border-sand-300 bg-[#f7f6f1] animate-fade-in">
            <div className="px-4 py-3 space-y-1 max-h-[80vh] overflow-y-auto">
              {visibleNavLinks.map((link) => {
                const active = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={classNames(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                      active ? 'bg-forest-100 text-forest-700' : 'text-forest-600 hover:bg-forest-50'
                    )}
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
              {isAdmin && ADMIN_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
              {!user && (
                <div className="pt-3 border-t border-sand-200 flex flex-col gap-2">
                  <Link to="/connexion" className="btn-secondary w-full">Connexion</Link>
                  <Link to="/inscription" className="btn-primary w-full">S'inscrire</Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-sand-200 bg-forest-950 text-sand-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-forest">
                  <Leaf className="h-5 w-5 text-white" />
                </div>
                <span className="font-display text-lg font-extrabold text-white">KinshasaEco</span>
              </div>
              <p className="text-sm text-sand-300 leading-relaxed">
                Plateforme collaborative pour une gestion environnementale durable de la ville de Kinshasa.
              </p>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white mb-3">Plateforme</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/carte" className="text-sand-300 hover:text-white transition-colors">Carte interactive</Link></li>
                <li><Link to="/signalements" className="text-sand-300 hover:text-white transition-colors">Signalements</Link></li>
                <li><Link to="/dechets" className="text-sand-300 hover:text-white transition-colors">Gestion des déchets</Link></li>
                <li><Link to="/statistiques" className="text-sand-300 hover:text-white transition-colors">Statistiques</Link></li>
                <li><Link to="/classement" className="text-sand-300 hover:text-white transition-colors">Classement</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white mb-3">Ressources</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/education" className="text-sand-300 hover:text-white transition-colors">Centre éducatif</Link></li>
                <li><Link to="/actualites" className="text-sand-300 hover:text-white transition-colors">Actualités</Link></li>
                <li><Link to="/aide" className="text-sand-300 hover:text-white transition-colors">Centre d'aide</Link></li>
                <li><Link to="/a-propos" className="text-sand-300 hover:text-white transition-colors">À propos</Link></li>
                <li><Link to="/faq" className="text-sand-300 hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="/contact" className="text-sand-300 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold text-white mb-3">Informations</h3>
              <ul className="space-y-2 text-sm">
                <li><Link to="/mentions-legales" className="text-sand-300 hover:text-white transition-colors">Mentions légales</Link></li>
                <li><Link to="/confidentialite" className="text-sand-300 hover:text-white transition-colors">Politique de confidentialité</Link></li>
                <li><Link to="/conditions" className="text-sand-300 hover:text-white transition-colors">Conditions d'utilisation</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-forest-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-sand-400">© 2025 KinshasaEco. Conçu pour la ville de Kinshasa, République Démocratique du Congo.</p>
            <div className="flex items-center gap-4 text-xs text-sand-400">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> 24 communes couvertes</span>
              <span className="flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5" /> Support 24/7</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
