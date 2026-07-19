import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle, Search, Mail, Phone, MapPin, MessageSquare, Send,
  ChevronDown, FileText, Shield, AlertTriangle, Home, ArrowLeft,
} from 'lucide-react';
import { PageHeader, Card, ErrorState } from '../components/ui';
import { classNames } from '../lib/utils';
import { supabase } from '../lib/supabase';

const FAQ_ITEMS = [
  { q: 'Comment créer un signalement ?', a: 'Connectez-vous à votre compte, cliquez sur "Nouveau signalement" dans le menu, décrivez l\'incident, ajoutez une photo et sélectionnez votre commune. Votre signalement sera visible immédiatement par la communauté.' },
  { q: 'Qui peut voir mes signalements ?', a: 'Tous les signalements sont publics et visibles par tous les utilisateurs de la plateforme, y compris les invités non connectés. Cela permet une transparence totale sur les problèmes environnementaux.' },
  { q: 'Comment fonctionne la gamification ?', a: 'Vous gagnez des points à chaque action positive : 10 points par signalement, 5 points par vote reçu, 50 points par campagne participée. Les points vous font progresser à travers 4 niveaux : Débutant, Citoyen Actif, Éco-Militant et Ambassadeur Vert.' },
  { q: 'Comment sont traités mes signalements ?', a: 'Après création, un signalement est en statut "En attente". Les administrateurs et autorités le valident puis le passent en "En cours" lorsqu\'une action est entreprise, puis en "Résolu" une fois le problème traité.' },
  { q: 'Puis-je signaler un incident sans être connecté ?', a: 'Non, vous devez créer un compte pour signaler un incident. Cela garantit la traçabilité et la qualité des signalements, et permet de vous attribuer vos points et badges.' },
  { q: 'Comment utiliser la carte interactive ?', a: 'Rendez-vous sur la page Carte. Vous y verrez tous les signalements géolocalisés et les points de dépôt. Utilisez les filtres pour affiner par type ou statut, et changez de couche de carte (standard ou satellite).' },
  { q: 'Mes données personnelles sont-elles protégées ?', a: 'Oui. Vos données sont protégées par les politiques de sécurité Supabase (Row Level Security). Seules les informations que vous publiez publiquement (signalements) sont visibles par les autres. Votre email et téléphone restent privés.' },
  { q: 'Comment devenir collecteur ?', a: 'Inscrivez-vous avec le rôle "Collecteur" ou contactez un administrateur pour faire changer votre rôle. Les collecteurs peuvent gérer les tournées, mettre à jour l\'état des points de dépôt et valider les collectes.' },
];

export function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  const [search, setSearch] = useState('');

  const filtered = FAQ_ITEMS.filter((item) =>
    item.q.toLowerCase().includes(search.toLowerCase()) || item.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Foire aux questions" subtitle="Trouvez rapidement les réponses à vos questions" />
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Rechercher une question…" />
      </div>
      <div className="space-y-3">
        {filtered.map((item, i) => (
          <Card key={i} className="overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
              <span className="font-medium text-forest-900">{item.q}</span>
              <ChevronDown className={classNames('h-5 w-5 text-forest-400 flex-shrink-0 transition-transform', open === i && 'rotate-180')} />
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-forest-600 leading-relaxed animate-fade-in">{item.a}</div>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 text-center text-forest-400">Aucune question trouvée. <Link to="/contact" className="text-forest-600 font-medium">Contactez-nous</Link></Card>
        )}
      </div>
    </div>
  );
}

export function HelpCenterPage() {
  const sections = [
    { icon: HelpCircle, title: 'Premiers pas', desc: 'Créer un compte, se connecter, faire son premier signalement', link: '/inscription' },
    { icon: FileText, title: 'Signaler un incident', desc: 'Comment signaler, ajouter une photo, géolocaliser', link: '/signalements/nouveau' },
    { icon: MapPin, title: 'Utiliser la carte', desc: 'Visualiser les incidents et points de collecte', link: '/carte' },
    { icon: Shield, title: 'Sécurité et confidentialité', desc: 'Comprendre comment vos données sont protégées', link: '/confidentialite' },
    { icon: MessageSquare, title: 'Foire aux questions', desc: 'Réponses aux questions les plus fréquentes', link: '/faq' },
    { icon: Mail, title: 'Nous contacter', desc: 'Une question ? L\'équipe vous répond', link: '/contact' },
  ];
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Centre d'aide" subtitle="Tout ce dont vous avez besoin pour utiliser la plateforme" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link key={s.title} to={s.link} className="card p-6 hover:shadow-md transition-transform transition-shadow group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-100 text-forest-600 mb-4 group-hover:scale-110 transition-transform">
              <s.icon className="h-6 w-6" />
            </div>
            <h3 className="font-display font-semibold text-forest-900">{s.title}</h3>
            <p className="mt-2 text-sm text-forest-500">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // Store contact message in audit_logs as a simple contact form solution
    const { error } = await supabase.from('audit_logs').insert({
      action: 'contact_form',
      entity_type: 'contact',
      details: { name, email, subject, message },
    });
    setLoading(false);
    if (error) { setError('Une erreur est survenue. Réessayez.'); return; }
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title="Contact" subtitle="Une question, une suggestion ? Écrivez à l'équipe KinshasaEco" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="h-5 w-5 text-forest-600" />
              <h3 className="font-display font-semibold text-forest-900">Email</h3>
            </div>
            <p className="text-sm text-forest-500">contact@kinshasaeco.cd</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="h-5 w-5 text-forest-600" />
              <h3 className="font-display font-semibold text-forest-900">Téléphone</h3>
            </div>
            <p className="text-sm text-forest-500">+243 890 000 000</p>
          </Card>
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="h-5 w-5 text-forest-600" />
              <h3 className="font-display font-semibold text-forest-900">Adresse</h3>
            </div>
            <p className="text-sm text-forest-500">Avenue de la Justice, Commune de Gombe, Kinshasa, RDC</p>
          </Card>
        </div>
        <Card className="p-6 lg:col-span-2">
          {sent ? (
            <div className="text-center py-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-100 text-forest-600 mb-4">
                <Send className="h-7 w-7" />
              </div>
              <h3 className="font-display font-semibold text-forest-900">Message envoyé !</h3>
              <p className="mt-2 text-sm text-forest-500">Nous vous répondrons dans les plus brefs délais.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <ErrorState message={error} />}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="c-name">Nom</label>
                  <input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="c-email">Email</label>
                  <input id="c-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
                </div>
              </div>
              <div>
                <label className="label" htmlFor="c-subject">Sujet</label>
                <input id="c-subject" required value={subject} onChange={(e) => setSubject(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label" htmlFor="c-msg">Message</label>
                <textarea id="c-msg" required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="input resize-none" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Envoi…' : 'Envoyer le message'} <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader title={title} subtitle={`Dernière mise à jour : ${updated}`} />
      <Card className="p-8 prose prose-forest max-w-none">
        <div className="text-forest-700 leading-relaxed space-y-4">{children}</div>
      </Card>
    </div>
  );
}

export function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" updated="3 juillet 2025">
      <h2 className="font-display font-semibold text-forest-900">Éditeur de la plateforme</h2>
      <p>La plateforme KinshasaEco est éditée dans le cadre d'un projet universitaire visant à améliorer la gestion environnementale de la ville de Kinshasa, République Démocratique du Congo.</p>
      <h2 className="font-display font-semibold text-forest-900">Hébergement</h2>
      <p>La plateforme est hébergée sur une infrastructure cloud sécurisée (Supabase) garantissant la disponibilité, la sécurité et la confidentialité des données.</p>
      <h2 className="font-display font-semibold text-forest-900">Propriété intellectuelle</h2>
      <p>L'ensemble des contenus présents sur la plateforme (textes, graphiques, logos, icônes) est protégé par le droit de la propriété intellectuelle. Toute reproduction sans autorisation est interdite.</p>
      <h2 className="font-display font-semibold text-forest-900">Responsabilité</h2>
      <p>La plateforme ne saurait être tenue responsable des informations publiées par les utilisateurs dans leurs signalements. Les contenus éducatifs sont fournis à titre informatif.</p>
    </LegalLayout>
  );
}

export function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="3 juillet 2025">
      <h2 className="font-display font-semibold text-forest-900">Collecte des données</h2>
      <p>Nous collectons uniquement les données nécessaires au fonctionnement de la plateforme : nom, email, commune, et les informations que vous publiez dans vos signalements.</p>
      <h2 className="font-display font-semibold text-forest-900">Utilisation des données</h2>
      <p>Vos données servent à : (1) gérer votre compte, (2) afficher vos signalements, (3) calculer votre score éco-citoyen, (4) vous envoyer des notifications.</p>
      <h2 className="font-display font-semibold text-forest-900">Protection des données</h2>
      <p>Les données sont protégées par Row Level Security (RLS) au niveau de la base de données. Votre email et téléphone ne sont jamais visibles par les autres utilisateurs.</p>
      <h2 className="font-display font-semibold text-forest-900">Vos droits</h2>
      <p>Vous disposez d'un droit d'accès, de modification et de suppression de vos données. Vous pouvez supprimer votre compte à tout moment depuis les paramètres.</p>
      <h2 className="font-display font-semibold text-forest-900">Cookies</h2>
      <p>La plateforme utilise des cookies de session nécessaires à l'authentification. Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>
    </LegalLayout>
  );
}

export function ConditionsPage() {
  return (
    <LegalLayout title="Conditions d'utilisation" updated="3 juillet 2025">
      <h2 className="font-display font-semibold text-forest-900">Acceptation des conditions</h2>
      <p>En utilisant la plateforme KinshasaEco, vous acceptez les présentes conditions d'utilisation. Si vous n'êtes pas d'accord, veuillez ne pas utiliser la plateforme.</p>
      <h2 className="font-display font-semibold text-forest-900">Comportement de l'utilisateur</h2>
      <p>Vous vous engagez à : (1) publier des signalements véridiques, (2) ne pas usurper l'identité d'autrui, (3) ne pas publier de contenu injurieux ou diffamatoire, (4) respecter les autres utilisateurs.</p>
      <h2 className="font-display font-semibold text-forest-900">Modération</h2>
      <p>Les administrateurs se réservent le droit de modérer, supprimer ou rejeter tout signalement ou contenu ne respectant pas les conditions. Les comptes abusifs peuvent être suspendus.</p>
      <h2 className="font-display font-semibold text-forest-900">Limitation de responsabilité</h2>
      <p>La plateforme est fournie "telle quelle" sans garantie. Les créateurs ne sont pas responsables des dommages indirects liés à l'utilisation de la plateforme.</p>
    </LegalLayout>
  );
}

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center animate-fade-in-up">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-forest-100 text-forest-600 mb-6">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 className="font-display text-6xl font-extrabold text-forest-900">404</h1>
        <p className="mt-3 text-lg text-forest-600">La page que vous recherchez n'existe pas ou a été déplacée.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex"><Home className="h-4 w-4" /> Retour à l'accueil</Link>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center animate-fade-in-up">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-600 mb-6">
          <Shield className="h-10 w-10" />
        </div>
        <h1 className="font-display text-6xl font-extrabold text-forest-900">403</h1>
        <p className="mt-3 text-lg text-forest-600">Accès refusé. Vous n'avez pas les permissions nécessaires pour consulter cette page.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex"><Home className="h-4 w-4" /> Retour à l'accueil</Link>
      </div>
    </div>
  );
}

export function ServerErrorPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center animate-fade-in-up">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-red-100 text-red-600 mb-6">
          <AlertTriangle className="h-10 w-10" />
        </div>
        <h1 className="font-display text-6xl font-extrabold text-forest-900">500</h1>
        <p className="mt-3 text-lg text-forest-600">Une erreur serveur est survenue. Notre équipe a été notifiée.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex"><ArrowLeft className="h-4 w-4" /> Retour à l'accueil</Link>
      </div>
    </div>
  );
}
