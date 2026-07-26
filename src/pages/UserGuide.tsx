import { Link } from 'react-router-dom';
import {
  Users, Recycle, BookOpen, Shield, MapPin, AlertTriangle,
  BarChart3, ChevronRight, Search, Filter, Plus,
} from 'lucide-react';
import { PageHeader, Card, EmptyState } from '../components/ui';

const ROLES = [
  {
    key: 'citoyen',
    title: 'Citoyen',
    icon: Users,
    color: 'bg-forest-100 text-forest-700',
    description: 'Signalez et suivez les incidents environnementaux de votre quartier.',
    steps: [
      { title: 'Créer un compte', desc: 'Inscrivez-vous avec le rôle Citoyen et sélectionnez votre commune.' },
      { title: 'Signaler un incident', desc: 'Cliquez sur « Nouveau signalement », décrivez le problème, ajoutez une photo et géolocalisez-le.' },
      { title: 'Suivre les signalements', desc: 'Consultez vos signalements dans /signalements et suivez leur traitement.' },
      { title: 'Participer sur la carte', desc: 'Visualisez tous les incidents et points de collecte sur la carte interactive.' },
    ],
  },
  {
    key: 'collecteur',
    title: 'Collecteur',
    icon: Recycle,
    color: 'bg-earth-100 text-earth-700',
    description: 'Gérez les tournées de ramassage et mettez à jour l\'état des points de dépôt.',
    steps: [
      { title: 'Accéder à la gestion des déchets', desc: 'Rendez-vous dans le module Déchets pour voir les points de dépôt et tournées.' },
      { title: 'Mettre à jour les dépôts', desc: 'Modifiez le statut et le remplissage des points de dépôt.' },
      { title: 'Planifier une tournée', desc: 'Créez et planifiez les tournées de collecte par commune et par date.' },
      { title: 'Suivre les arrêts', desc: 'Enregistrez les quantités collectées pour chaque arrêt de la tournée.' },
    ],
  },
  {
    key: 'ong',
    title: 'ONG / Partenaire',
    icon: BookOpen,
    color: 'bg-river-100 text-river-700',
    description: 'Publiez des contenus éducatifs et des campagnes de sensibilisation.',
    steps: [
      { title: 'Créer un article', desc: 'Rédigez et publiez des articles éducatifs dans le Centre éducatif.' },
      { title: 'Lancer une campagne', desc: 'Planifiez une campagne de sensibilisation avec une date de début et de fin.' },
      { title: 'Suivre les lectures', desc: 'Consultez le nombre de vues et l\'engagement sur vos publications.' },
      { title: 'Partager les actualités', desc: 'Publiez des actualités pour informer la communauté des actions menées.' },
    ],
  },
  {
    key: 'autorite',
    title: 'Autorité Publique',
    icon: Shield,
    color: 'bg-amber-100 text-amber-700',
    description: 'Consultez les statistiques et affectez les signalements aux équipes.',
    steps: [
      { title: 'Accéder aux statistiques', desc: 'Consultez les indicateurs environnementaux par commune et dans le temps.' },
      { title: 'Modérer les signalements', desc: 'Validez, rejetez ou attribuez les signalements aux équipes compétentes.' },
      { title: 'Analyser les données', desc: 'Utilisez les graphiques et exports CSV pour orienter les politiques publiques.' },
      { title: 'Suivre les collecteurs', desc: 'Consultez les tournées et les performances de collecte par commune.' },
    ],
  },
];

export function UserGuidePage() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader
        title="Guide utilisateur"
        subtitle="Découvrez comment utiliser la plateforme selon votre rôle"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {ROLES.map((r) => (
          <Card key={r.key} className="p-5 hover:shadow-md transition-shadow">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl mb-3 ${r.color}`}>
              <r.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display font-semibold text-forest-900 text-sm">{r.title}</h3>
            <p className="mt-1 text-xs text-forest-500 leading-relaxed">{r.description}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        {ROLES.map((role) => (
          <Card key={role.key} className="p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${role.color}`}>
                <role.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-forest-900">Guide {role.title}</h3>
                <p className="text-sm text-forest-500">{role.description}</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {role.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 p-4 rounded-xl bg-sand-50 border border-sand-100">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white text-forest-700 font-display font-bold text-sm shadow-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-forest-900">{step.title}</p>
                    <p className="text-xs text-forest-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
