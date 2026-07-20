import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReactLenis } from 'lenis/react';
import { AuthProvider } from './lib/auth';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const SignalementsListPage = lazy(() => import('./pages/SignalementPages').then((m) => ({ default: m.SignalementsListPage })));
const SignalementCreatePage = lazy(() => import('./pages/SignalementPages').then((m) => ({ default: m.SignalementCreatePage })));
const SignalementDetailPage = lazy(() => import('./pages/SignalementPages').then((m) => ({ default: m.SignalementDetailPage })));
const CartePage = lazy(() => import('./pages/CartePage').then((m) => ({ default: m.CartePage })));
const DechetsPage = lazy(() => import('./pages/DechetsPage').then((m) => ({ default: m.DechetsPage })));
const EducationPage = lazy(() => import('./pages/EducationPages').then((m) => ({ default: m.EducationPage })));
const ArticleDetailPage = lazy(() => import('./pages/EducationPages').then((m) => ({ default: m.ArticleDetailPage })));
const CampagnesPage = lazy(() => import('./pages/EducationPages').then((m) => ({ default: m.CampagnesPage })));
const ActualitesPage = lazy(() => import('./pages/EducationPages').then((m) => ({ default: m.ActualitesPage })));
const ClassementPage = lazy(() => import('./pages/ClassementPage').then((m) => ({ default: m.ClassementPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePages').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('./pages/ProfilePages').then((m) => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('./pages/ProfilePages').then((m) => ({ default: m.SettingsPage })));
const StatistiquesPage = lazy(() => import('./pages/StatistiquesPage').then((m) => ({ default: m.StatistiquesPage })));
const FAQPage = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.FAQPage })));
const HelpCenterPage = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.HelpCenterPage })));
const ContactPage = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.ContactPage })));
const MentionsLegalesPage = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.MentionsLegalesPage })));
const ConfidentialitePage = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.ConfidentialitePage })));
const ConditionsPage = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.ConditionsPage })));
const NotFoundPage = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.NotFoundPage })));
const ServerErrorPage = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.ServerErrorPage })));
const ForbiddenPage = lazy(() => import('./pages/StaticPages').then((m) => ({ default: m.ForbiddenPage })));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-forest-200 border-t-forest-600" />
    </div>
  );
}

function App() {
  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/connexion" element={<LoginPage />} />
              <Route path="/inscription" element={<RegisterPage />} />
              <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
              <Route path="/carte" element={<CartePage />} />
              <Route path="/dechets" element={<ProtectedRoute><DechetsPage /></ProtectedRoute>} />
              <Route path="/education" element={<EducationPage />} />
              <Route path="/education/:slug" element={<ArticleDetailPage />} />
              <Route path="/campagnes" element={<CampagnesPage />} />
              <Route path="/actualites" element={<ActualitesPage />} />
              <Route path="/statistiques" element={<ProtectedRoute roles={['autorite','admin']}><StatistiquesPage /></ProtectedRoute>} />
              <Route path="/classement" element={<ProtectedRoute><ClassementPage /></ProtectedRoute>} />
              <Route path="/signalements" element={<SignalementsListPage />} />
              <Route path="/signalements/:id" element={<SignalementDetailPage />} />
              <Route path="/aide" element={<HelpCenterPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/a-propos" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="/confidentialite" element={<ConfidentialitePage />} />
              <Route path="/conditions" element={<ConditionsPage />} />

              {/* Protected routes — any authenticated user */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/signalements/nouveau" element={<ProtectedRoute roles={['citoyen','admin']}><SignalementCreatePage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/parametres" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

              {/* Admin routes — admin only */}
              <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>} />

              {/* Error pages */}
              <Route path="/403" element={<ForbiddenPage />} />
              <Route path="*" element={<NotFoundPage />} />
              <Route path="/erreur" element={<ServerErrorPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
    </ReactLenis>
  );
}

export default App;
