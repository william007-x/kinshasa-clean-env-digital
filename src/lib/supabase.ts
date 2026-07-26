import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Check .env for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserRole =
  | 'admin'
  | 'citoyen'
  | 'collecteur'
  | 'ong'
  | 'autorite';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  commune_id: string | null;
  bio: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Commune {
  id: string;
  name: string;
  code: string;
  population: number;
  area_km2: number;
  eco_score: number;
  created_at: string;
}

export type SignalementType =
  | 'depot_sauvage'
  | 'inondation'
  | 'erosion'
  | 'pollution_eau'
  | 'pollution_air'
  | 'autre';

export type SignalementStatus = 'en_attente' | 'en_cours' | 'resolu' | 'rejete';

export interface Signalement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: SignalementType;
  status: SignalementStatus;
  latitude: number;
  longitude: number;
  commune_id: string | null;
  photo_url: string | null;
  votes: number;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  communes?: Commune;
  profiles?: Profile;
}

export interface PointDepot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  commune_id: string | null;
  capacity_m3: number;
  current_fill_pct: number;
  status: 'actif' | 'plein' | 'hors_service' | 'maintenance';
  last_collected_at: string | null;
  created_at: string;
  communes?: Commune;
}

export interface Collecteur {
  id: string;
  user_id: string | null;
  name: string;
  vehicle_type: 'camion' | 'tricycle' | 'charrette' | 'autre';
  commune_ids: string[];
  active: boolean;
  created_at: string;
}

export interface Tournee {
  id: string;
  collecteur_id: string | null;
  commune_id: string | null;
  date_scheduled: string;
  date_completed: string | null;
  status: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  notes: string | null;
  created_at: string;
  collecteurs?: Collecteur;
  communes?: Commune;
  tournee_points?: TourneePoint[];
}

export interface TourneePoint {
  id: string;
  tournee_id: string;
  point_depot_id: string;
  order_index: number;
  collected_at: string | null;
  quantity_kg: number | null;
  points_depot?: PointDepot;
}

export type ArticleCategory =
  | 'general'
  | 'dechets'
  | 'eau'
  | 'erosion'
  | 'biodiversite'
  | 'sante'
  | 'energie'
  | 'actualite';

export interface Article {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: ArticleCategory;
  image_url: string | null;
  tags: string[];
  published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Campagne {
  id: string;
  organizer_id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  target_commune_id: string | null;
  goal: string | null;
  participants_count: number;
  status: 'a_venir' | 'active' | 'terminee' | 'annulee';
  image_url: string | null;
  created_at: string;
  communes?: Commune;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'signalement';
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  profiles?: Profile;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  citoyen: 'Citoyen',
  collecteur: 'Collecteur',
  ong: 'ONG',
  autorite: 'Autorité Publique',
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'badge-red',
  citoyen: 'badge-forest',
  collecteur: 'badge-earth',
  ong: 'badge-river',
  autorite: 'badge-amber',
};

export const SIGNALEMENT_TYPE_LABELS: Record<SignalementType, string> = {
  depot_sauvage: 'Dépôt sauvage',
  inondation: 'Inondation',
  erosion: 'Érosion',
  pollution_eau: 'Pollution de l\'eau',
  pollution_air: 'Pollution de l\'air',
  autre: 'Autre',
};

export const SIGNALEMENT_STATUS_LABELS: Record<SignalementStatus, string> = {
  en_attente: 'En attente',
  en_cours: 'En cours',
  resolu: 'Résolu',
  rejete: 'Rejeté',
};

export const SIGNALEMENT_STATUS_COLORS: Record<SignalementStatus, string> = {
  en_attente: 'badge-amber',
  en_cours: 'badge-river',
  resolu: 'badge-forest',
  rejete: 'badge-red',
};

export const ARTICLE_CATEGORY_LABELS: Record<ArticleCategory, string> = {
  general: 'Général',
  dechets: 'Déchets',
  eau: 'Eau',
  erosion: 'Érosion',
  biodiversite: 'Biodiversité',
  sante: 'Santé',
  energie: 'Énergie',
  actualite: 'Actualité',
};
