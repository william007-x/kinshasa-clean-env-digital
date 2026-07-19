import { useEffect, useState } from 'react';
import {
  Trash2, MapPin, Truck, Calendar, Plus, CheckCircle2, AlertCircle,
  Package, Route,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  type PointDepot, type Collecteur, type Tournee,
} from '../lib/supabase';
import { PageHeader, Card, LoadingState, EmptyState, StatCard, ProgressBar, Modal, ErrorState } from '../components/ui';
import { classNames, formatDate, KINSHASA_COMMUNES_COORDS } from '../lib/utils';
import { useAuth } from '../lib/auth';

const DEPOT_STATUS_LABELS = {
  actif: 'Actif',
  plein: 'Plein',
  hors_service: 'Hors service',
  maintenance: 'Maintenance',
};

const DEPOT_STATUS_COLORS = {
  actif: 'badge-forest',
  plein: 'badge-red',
  hors_service: 'badge-sand',
  maintenance: 'badge-amber',
};

const TOURNEE_STATUS_LABELS = {
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

const TOURNEE_STATUS_COLORS = {
  planifiee: 'badge-amber',
  en_cours: 'badge-river',
  terminee: 'badge-forest',
  annulee: 'badge-red',
};

export function DechetsPage() {
  const { profile } = useAuth();
  const role = profile?.role;
  const canManageDepots = role === 'admin' || role === 'autorite';
  const canManageTournees = role === 'admin' || role === 'collecteur';
  const canManageCollecteurs = role === 'admin';
  const [tab, setTab] = useState<'depots' | 'tournees' | 'collecteurs'>('depots');
  const [depots, setDepots] = useState<PointDepot[]>([]);
  const [tournees, setTournees] = useState<Tournee[]>([]);
  const [collecteurs, setCollecteurs] = useState<Collecteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDepotOpen, setAddDepotOpen] = useState(false);
  const [addTourneeOpen, setAddTourneeOpen] = useState(false);

  async function loadData() {
    const [depotRes, tourneeRes, collecteurRes] = await Promise.all([
      supabase.from('points_depot').select('*, communes(name)').order('created_at', { ascending: false }),
      supabase.from('tournees').select('*, collecteurs(name), communes(name), tournee_points(quantity_kg, points_depot(name))').order('date_scheduled', { ascending: false }),
      supabase.from('collecteurs').select('*').order('name'),
    ]);
    setDepots((depotRes.data as PointDepot[]) ?? []);
    setTournees((tourneeRes.data as Tournee[]) ?? []);
    setCollecteurs((collecteurRes.data as Collecteur[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const avgFill = depots.length > 0 ? Math.round(depots.reduce((sum, d) => sum + d.current_fill_pct, 0) / depots.length) : 0;
  const fullDepots = depots.filter((d) => d.status === 'plein').length;
  const activeTournees = tournees.filter((t) => t.status === 'en_cours' || t.status === 'planifiee').length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader
        title="Gestion des déchets"
        subtitle="Points de dépôt, tournées de collecte et équipes de collecteurs"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Points de dépôt" value={depots.length} icon={<Package className="h-5 w-5" />} color="forest" />
        <StatCard label="Remplissage moyen" value={`${avgFill}%`} icon={<AlertCircle className="h-5 w-5" />} color={avgFill > 70 ? 'red' : 'amber'} />
        <StatCard label="Points pleins" value={fullDepots} icon={<AlertCircle className="h-5 w-5" />} color="red" />
        <StatCard label="Tournées actives" value={activeTournees} icon={<Route className="h-5 w-5" />} color="river" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-sand-100 rounded-xl p-1 w-fit">
        {([
          { key: 'depots', label: 'Points de dépôt', icon: MapPin },
          { key: 'tournees', label: 'Tournées', icon: Calendar },
          ...(canManageCollecteurs ? [{ key: 'collecteurs', label: 'Collecteurs', icon: Truck }] : []),
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={classNames('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-[#f7f6f1] text-forest-700 shadow-sm' : 'text-forest-500 hover:text-forest-700')}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : tab === 'depots' ? (
        <DepotsTab depots={depots} onRefresh={loadData} addOpen={addDepotOpen} setAddOpen={setAddDepotOpen} canManage={canManageDepots} />
      ) : tab === 'tournees' ? (
        <TourneesTab tournees={tournees} collecteurs={collecteurs} onRefresh={loadData} addOpen={addTourneeOpen} setAddOpen={setAddTourneeOpen} canManage={canManageTournees} />
      ) : (
        <CollecteursTab collecteurs={collecteurs} />
      )}
    </div>
  );
}

function DepotsTab({ depots, onRefresh, addOpen, setAddOpen, canManage }: { depots: PointDepot[]; onRefresh: () => void; addOpen: boolean; setAddOpen: (v: boolean) => void; canManage: boolean }) {
  const [name, setName] = useState('');
  const [communeCode, setCommuneCode] = useState('');
  const [capacity, setCapacity] = useState('10');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const coords = KINSHASA_COMMUNES_COORDS[communeCode];
    if (!coords) { setError('Sélectionnez une commune.'); return; }
    setSaving(true);
    const { data: commune } = await supabase.from('communes').select('id').eq('code', communeCode).maybeSingle();
    const { error } = await supabase.from('points_depot').insert({
      name, latitude: coords[0], longitude: coords[1], commune_id: commune?.id, capacity_m3: Number(capacity),
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setName(''); setCommuneCode(''); setCapacity('10'); setAddOpen(false); onRefresh();
  }

  return (
    <>
      {canManage && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus className="h-4 w-4" /> Ajouter un point</button>
        </div>
      )}
      {depots.length === 0 ? (
        <EmptyState icon={<Package className="h-12 w-12" />} title="Aucun point de dépôt" description="Ajoutez le premier point de dépôt de la plateforme." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {depots.map((depot) => (
            <Card key={depot.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-600">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-forest-900">{depot.name}</h3>
                    {depot.communes && <p className="text-xs text-forest-500 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{depot.communes.name}</p>}
                  </div>
                </div>
                <span className={DEPOT_STATUS_COLORS[depot.status]}>{DEPOT_STATUS_LABELS[depot.status]}</span>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-forest-500">Remplissage</span>
                  <span className="font-semibold text-forest-900">{depot.current_fill_pct}%</span>
                </div>
                <ProgressBar value={depot.current_fill_pct} color={depot.current_fill_pct > 80 ? 'red' : depot.current_fill_pct > 60 ? 'amber' : 'forest'} />
                <p className="text-xs text-forest-400 mt-2">Capacité: {depot.capacity_m3} m³</p>
                {depot.last_collected_at && <p className="text-xs text-forest-400">Dernière collecte: {formatDate(depot.last_collected_at)}</p>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nouveau point de dépôt">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <ErrorState message={error} />}
          <div>
            <label className="label" htmlFor="depot-name">Nom</label>
            <input id="depot-name" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Ex: Dépôt central de Gombe" />
          </div>
          <div>
            <label className="label" htmlFor="depot-commune">Commune</label>
            <select id="depot-commune" required value={communeCode} onChange={(e) => setCommuneCode(e.target.value)} className="input">
              <option value="">Sélectionner…</option>
              {Object.keys(KINSHASA_COMMUNES_COORDS).map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="depot-cap">Capacité (m³)</label>
            <input id="depot-cap" type="number" step="0.1" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Création…' : 'Créer le point'}</button>
        </form>
      </Modal>
    </>
  );
}

function TourneesTab({ tournees, collecteurs, onRefresh, addOpen, setAddOpen, canManage }: { tournees: Tournee[]; collecteurs: Collecteur[]; onRefresh: () => void; addOpen: boolean; setAddOpen: (v: boolean) => void; canManage: boolean }) {
  const [collecteurId, setCollecteurId] = useState('');
  const [communeCode, setCommuneCode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { data: commune } = await supabase.from('communes').select('id').eq('code', communeCode).maybeSingle();
    const { error } = await supabase.from('tournees').insert({
      collecteur_id: collecteurId || null,
      commune_id: commune?.id ?? null,
      date_scheduled: date,
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setCollecteurId(''); setCommuneCode(''); setAddOpen(false); onRefresh();
  }

  return (
    <>
      {canManage && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setAddOpen(true)} className="btn-primary"><Plus className="h-4 w-4" /> Planifier une tournée</button>
        </div>
      )}
      {tournees.length === 0 ? (
        <EmptyState icon={<Calendar className="h-12 w-12" />} title="Aucune tournée planifiée" description="Planifiez la première tournée de collecte." />
      ) : (
        <div className="space-y-3">
          {tournees.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-river-100 text-river-700">
                    <Route className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-forest-900">{t.collecteurs?.name ?? 'Non assignée'}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-forest-500 mt-1">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(t.date_scheduled)}</span>
                      {t.communes && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{t.communes.name}</span>}
                      {t.tournee_points && t.tournee_points.length > 0 && (
                        <span className="flex items-center gap-1"><Package className="h-3 w-3" />{t.tournee_points.length} arrêts</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={TOURNEE_STATUS_COLORS[t.status]}>{TOURNEE_STATUS_LABELS[t.status]}</span>
                  {t.date_completed && <span className="text-xs text-forest-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{formatDate(t.date_completed)}</span>}
                </div>
              </div>
              {t.notes && <p className="mt-3 text-sm text-forest-500 border-t border-sand-100 pt-3">{t.notes}</p>}
            </Card>
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Planifier une tournée">
        <form onSubmit={handleAdd} className="space-y-4">
          {error && <ErrorState message={error} />}
          <div>
            <label className="label" htmlFor="tour-collecteur">Collecteur</label>
            <select id="tour-collecteur" value={collecteurId} onChange={(e) => setCollecteurId(e.target.value)} className="input">
              <option value="">Non assigné</option>
              {collecteurs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tour-commune">Commune</label>
            <select id="tour-commune" value={communeCode} onChange={(e) => setCommuneCode(e.target.value)} className="input">
              <option value="">Sélectionner…</option>
              {Object.keys(KINSHASA_COMMUNES_COORDS).map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1).replace('-', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tour-date">Date prévue</label>
            <input id="tour-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Planification…' : 'Planifier'}</button>
        </form>
      </Modal>
    </>
  );
}

function CollecteursTab({ collecteurs }: { collecteurs: Collecteur[] }) {
  const VEHICLE_LABELS = { camion: 'Camion', tricycle: 'Tricycle', charrette: 'Charrette', autre: 'Autre' };
  return (
    <>
      {collecteurs.length === 0 ? (
        <EmptyState icon={<Truck className="h-12 w-12" />} title="Aucun collecteur enregistré" description="Les collecteurs seront affichés ici une fois enregistrés." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collecteurs.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-earth-100 text-earth-700">
                  <Truck className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-forest-900">{c.name}</h3>
                  <p className="text-xs text-forest-500 mt-0.5">{VEHICLE_LABELS[c.vehicle_type]}</p>
                </div>
                <span className={c.active ? 'badge-forest' : 'badge-sand'}>{c.active ? 'Actif' : 'Inactif'}</span>
              </div>
              {c.commune_ids.length > 0 && (
                <div className="mt-3 pt-3 border-t border-sand-100">
                  <p className="text-xs font-medium text-forest-600 mb-1.5">Communes desservies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.commune_ids.map((id) => <span key={id} className="badge-sand">{id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ')}</span>)}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
