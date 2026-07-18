import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, RegisterPage, ForgotPasswordPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { SignalementsListPage, SignalementCreatePage, SignalementDetailPage } from './pages/SignalementPages';
import { CartePage } from './pages/CartePage';
import { DechetsPage } from './pages/DechetsPage';
import { EducationPage, ArticleDetailPage, CampagnesPage, ActualitesPage } from './pages/EducationPages';
import { ClassementPage } from './pages/ClassementPage';
import { AboutPage } from './pages/AboutPage';
import { AdminPage } from './pages/AdminPage';
import { ProfilePage, NotificationsPage, SettingsPage } from './pages/ProfilePages';
import { StatistiquesPage } from './pages/StatistiquesPage';
import {
  FAQPage, HelpCenterPage, ContactPage,
  MentionsLegalesPage, ConfidentialitePage, ConditionsPage,
  NotFoundPage, ServerErrorPage, ForbiddenPage,
} from './pages/StaticPages';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
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
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
