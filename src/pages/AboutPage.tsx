import { Link } from 'react-router-dom';
import {
  Leaf, MapPin, Users, Shield, Target, Eye, Heart,
  Recycle, AlertTriangle, BarChart3, BookOpen, ArrowRight,
} from 'lucide-react';
import { PageHeader, Card } from '../components/ui';

const MISSION_POINTS = [
  { icon: AlertTriangle, title: 'Signaler', desc: 'Permettre à chaque citoyen de Kinshasa de signaler les incidents environnementaux : insalubrité, érosions, décharges sauvages, pollution.' },
  { icon: Recycle, title: 'Collecter', desc: 'Coordonner les tournées de ramassage et le suivi des points de dépôt pour une ville plus propre.' },
  { icon: BookOpen, title: 'Sensibiliser', desc: 'Diffuser des contenus éducatifs et des campagnes de sensibilisation portées par les ONG et partenaires écologiques.' },
  { icon: BarChart3, title: 'Décider', desc: 'Fournir aux autorités des tableaux de bord et indicateurs pour orienter la politique environnementale de la ville.' },
];

const VALUES = [
  { icon: Target, title: 'Mission', text: 'Construire une plateforme numérique écologique inclusive pour transformer Kinshasa en une ville propre, durable et résiliente.' },
  { icon: Eye, title: 'Vision', text: 'Une capitale où chaque citoyen est acteur de son environnement, où les données éclairent les décisions et où la collaboration entre acteurs crée un impact durable.' },
  { icon: Heart, title: 'Valeurs', text: 'Transparence, participation citoyenne, rigueur des données, équité d\'accès et responsabilité écologique.' },
];

const ROLES = [
  { icon: Users, title: 'Citoyen', desc: 'Signale et suit les incidents de son quartier.' },
  { icon: Recycle, title: 'Collecteur', desc: 'Gère les tournées de ramassage et met à jour les statuts.' },
  { icon: BookOpen, title: 'ONG / Partenaire', desc: 'Publie contenus éducatifs et campagnes de sensibilisation.' },
  { icon: Shield, title: 'Autorité', desc: 'Consulte les statistiques et affecte les signalements.' },
];

export function AboutPage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader
        title="À propos de KinshasaEco"
        subtitle="La plateforme numérique écologique de la ville de Kinshasa"
      />

      {/* Hero */}
      <Card className="overflow-hidden mb-8">
        <div className="relative gradient-forest px-6 py-12 sm:px-12 sm:py-16 text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm mb-4">
              <Leaf className="h-3.5 w-3.5" /> Projet universitaire L2 Math-Info
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">
              Une ville propre, par et pour ses citoyens
            </h2>
            <p className="mt-4 text-sand-100 leading-relaxed">
              KinshasaEco est une plateforme numérique écologique conçue pour la ville de Kinshasa.
              Elle connecte citoyens, collecteurs, ONG et autorités autour d'un objectif commun :
              améliorer le cadre de vie et la salubrité de la capitale congolaise.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/inscription" className="btn-primary bg-white text-primary-700 hover:bg-sand-50">
                Rejoindre le mouvement <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/carte" className="btn-ghost text-white border-white/40 hover:bg-white/10">
                Explorer la carte
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Mission / Vision / Valeurs */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {VALUES.map((v) => (
          <Card key={v.title} className="p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600 mb-4">
              <v.icon className="h-6 w-6" />
            </div>
            <h3 className="font-display font-semibold text-primary-900">{v.title}</h3>
            <p className="mt-2 text-sm text-primary-600 leading-relaxed">{v.text}</p>
          </Card>
        ))}
      </div>

      {/* Ce que la plateforme permet */}
      <Card className="p-6 sm:p-8 mb-8">
        <h3 className="font-display text-xl font-semibold text-primary-900 mb-6">
          Ce que la plateforme permet
        </h3>
        <div className="grid sm:grid-cols-2 gap-6">
          {MISSION_POINTS.map((m) => (
            <div key={m.title} className="flex gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <m.icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-primary-900">{m.title}</h4>
                <p className="mt-1 text-sm text-primary-600 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Rôles */}
      <Card className="p-6 sm:p-8 mb-8">
        <h3 className="font-display text-xl font-semibold text-primary-900 mb-2">
          Les acteurs de la plateforme
        </h3>
        <p className="text-sm text-primary-500 mb-6">
          Une gouvernance collaborative basée sur le principe du moindre privilège.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ROLES.map((r) => (
            <div key={r.title} className="rounded-xl border border-sand-200 p-5 hover:border-primary-300 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 mb-3">
                <r.icon className="h-5 w-5" />
              </div>
              <h4 className="font-display font-semibold text-primary-900 text-sm">{r.title}</h4>
              <p className="mt-1 text-xs text-primary-500 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { value: '24', label: 'Communes couvertes' },
          { value: '5', label: 'Rôles utilisateurs' },
          { value: '4', label: 'Modules fonctionnels' },
          { value: '100%', label: 'Open & collaboratif' },
        ].map((s) => (
          <Card key={s.label} className="p-5 text-center">
            <div className="font-display text-3xl font-extrabold text-primary-700">{s.value}</div>
            <div className="mt-1 text-xs text-primary-500">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="p-8 text-center bg-gradient-to-br from-primary-50 to-sand-50">
        <BookOpen className="mx-auto h-10 w-10 text-primary-600 mb-3" />
        <h3 className="font-display text-xl font-semibold text-primary-900">
          Besoin d'aide pour prendre en main la plateforme ?
        </h3>
        <p className="mt-2 text-sm text-primary-600 max-w-xl mx-auto">
          Consultez notre guide d'utilisation complet pour découvrir le fonctionnement de la plateforme selon votre rôle (Citoyen, Collecteur, ONG, Autorité).
        </p>
        <Link to="/guide" className="btn-primary mt-6 inline-flex">
          Consulter le guide utilisateur <BookOpen className="h-4 w-4" />
        </Link>
      </Card>
    </div>
  );
}
