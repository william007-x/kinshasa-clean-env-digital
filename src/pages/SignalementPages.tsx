import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, MapPin, Clock, ThumbsUp, ArrowLeft, ArrowRight,
  Filter, Search, Trash2, Droplets, Wind, Mountain, Image as ImageIcon, X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import {
  SIGNALEMENT_TYPE_LABELS, SIGNALEMENT_STATUS_LABELS, SIGNALEMENT_STATUS_COLORS,
  type Signalement, type SignalementType, type SignalementStatus,
} from '../lib/supabase';
import { PageHeader, Card, LoadingState, EmptyState, Modal, ErrorState } from '../components/ui';
import { classNames, timeAgo, formatDateTime, KINSHASA_COMMUNES_COORDS } from '../lib/utils';

const TYPE_ICONS: Record<SignalementType, typeof AlertTriangle> = {
  depot_sauvage: Trash2,
  inondation: Droplets,
  erosion: Mountain,
  pollution_eau: Droplets,
  pollution_air: Wind,
  autre: AlertTriangle,
};

const TYPE_OPTIONS: { value: SignalementType; label: string }[] = [
  { value: 'depot_sauvage', label: 'Dépôt sauvage' },
  { value: 'inondation', label: 'Inondation' },
  { value: 'erosion', label: 'Érosion' },
  { value: 'pollution_eau', label: 'Pollution de l\'eau' },
  { value: 'pollution_air', label: 'Pollution de l\'air' },
  { value: 'autre', label: 'Autre' },
];

export function SignalementsListPage() {
  const { user } = useAuth();
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<SignalementStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<SignalementType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showMine, setShowMine] = useState(false);

  useEffect(() => {
    (async () => {
      let query = supabase.from('signalements').select('*, communes(name), profiles(full_name)').order('created_at', { ascending: false });
      if (showMine && user) query = query.eq('user_id', user.id);
      const { data } = await query;
      setSignalements((data as Signalement[]) ?? []);
      setLoading(false);
    })();
  }, [user, showMine]);

  const filtered = signalements.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader
        title="Signalements"
        subtitle="Tous les incidents environnementaux signalés par la communauté"
        action={<Link to="/signalements/nouveau" className="btn-primary"><AlertTriangle className="h-4 w-4" /> Nouveau signalement</Link>}
      />

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-forest-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Rechercher un signalement…" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as SignalementType | 'all')} className="input lg:w-48">
            <option value="all">Tous les types</option>
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as SignalementStatus | 'all')} className="input lg:w-40">
            <option value="all">Tous statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_cours">En cours</option>
            <option value="resolu">Résolu</option>
            <option value="rejete">Rejeté</option>
          </select>
          {user && (
            <button
              onClick={() => setShowMine(!showMine)}
              className={classNames('btn', showMine ? 'bg-forest-600 text-white' : 'bg-[#f7f6f1] border border-sand-300 text-forest-700 hover:bg-forest-50')}
            >
              <Filter className="h-4 w-4" />
              {showMine ? 'Mes signalements' : 'Tous'}
            </button>
          )}
        </div>
      </Card>

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="h-12 w-12" />}
          title="Aucun signalement trouvé"
          description="Ajustez vos filtres ou soyez le premier à signaler un incident."
          action={<Link to="/signalements/nouveau" className="btn-primary"><AlertTriangle className="h-4 w-4" /> Créer un signalement</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sig) => {
            const Icon = TYPE_ICONS[sig.type];
            return (
              <Link key={sig.id} to={`/signalements/${sig.id}`} className="card overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">
                {sig.photo_url && (
                  <div className="aspect-video w-full overflow-hidden bg-sand-100">
                    <img src={sig.photo_url} alt={sig.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className={classNames(SIGNALEMENT_STATUS_COLORS[sig.status])}>{SIGNALEMENT_STATUS_LABELS[sig.status]}</span>
                    <span className="text-xs text-forest-400">{timeAgo(sig.created_at)}</span>
                  </div>
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-sand-100 text-forest-600">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="font-display font-semibold text-forest-900 text-sm leading-snug">{sig.title}</h3>
                  </div>
                  <p className="text-xs text-forest-500 line-clamp-2 mb-3">{sig.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-forest-400"><MapPin className="h-3 w-3" />{sig.communes?.name ?? 'Non localisé'}</span>
                    <span className="flex items-center gap-1 text-forest-500"><ThumbsUp className="h-3 w-3" />{sig.votes}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SignalementCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<SignalementType>('depot_sauvage');
  const [communeCode, setCommuneCode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 5 Mo.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  }

  function detectLocation() {
    setGeoLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur.');
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setGeoLoading(false);
      },
      () => {
        setError('Impossible d\'obtenir votre position. Veuillez sélectionner une commune.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);

    let lat = latitude;
    let lng = longitude;

    if (lat === null || lng === null) {
      if (communeCode && KINSHASA_COMMUNES_COORDS[communeCode]) {
        [lat, lng] = KINSHASA_COMMUNES_COORDS[communeCode];
      } else {
        setError('Veuillez activer la géolocalisation ou sélectionner une commune.');
        return;
      }
    }

    let communeId: string | null = null;
    if (communeCode) {
      const { data: commune } = await supabase.from('communes').select('id').eq('code', communeCode).maybeSingle();
      communeId = commune?.id ?? null;
    }

    setLoading(true);

    let photoUrl: string | null = null;
    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('signalements').upload(fileName, photoFile);
      if (uploadError) {
        setError('Erreur lors de l\'upload de la photo: ' + uploadError.message);
        setLoading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('signalements').getPublicUrl(fileName);
      photoUrl = urlData.publicUrl;
    }

    const { data, error: insertError } = await supabase.from('signalements').insert({
      user_id: user.id,
      title,
      description,
      type,
      latitude: lat,
      longitude: lng,
      commune_id: communeId,
      photo_url: photoUrl,
    }).select().single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    await supabase.rpc('award_points', { amount: 10 });

    navigate(`/signalements/${data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Link to="/signalements" className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-600 hover:text-forest-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Retour aux signalements
      </Link>
      <PageHeader title="Nouveau signalement" subtitle="Décrivez l'incident environnemental que vous souhaitez signaler" />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorState message={error} />}

        <Card className="p-6 space-y-5">
          <div>
            <label className="label" htmlFor="title">Titre</label>
            <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="Ex: Dépôt sauvage sur avenue Kasa-Vubu" />
          </div>

          <div>
            <label className="label">Type d'incident</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((t) => {
                const Icon = TYPE_ICONS[t.value];
                return (
                  <button key={t.value} type="button" onClick={() => setType(t.value)}
                    className={classNames('flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-all',
                      type === t.value ? 'border-forest-500 bg-forest-50 text-forest-700 ring-2 ring-forest-200' : 'border-sand-300 text-forest-600 hover:border-forest-300')}>
                    <Icon className="h-5 w-5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="desc">Description</label>
            <textarea id="desc" required value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="input resize-none" placeholder="Décrivez l'incident en détail…"></textarea>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="commune">Commune</label>
              <select id="commune" value={communeCode} onChange={(e) => setCommuneCode(e.target.value)} className="input">
                <option value="">Sélectionner…</option>
                {Object.entries(KINSHASA_COMMUNES_COORDS).map(([code]) => (
                  <option key={code} value={code}>{code.charAt(0).toUpperCase() + code.slice(1).replace('-', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Localisation GPS</label>
              <button type="button" onClick={detectLocation} disabled={geoLoading} className="btn-secondary w-full">
                <MapPin className="h-4 w-4" />
                {geoLoading ? 'Localisation…' : latitude !== null ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : 'Détecter ma position'}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Photo (optionnel, max 5 Mo)</label>
            {photoPreview ? (
              <div className="relative inline-block">
                <img src={photoPreview} alt="Aperçu" className="h-32 w-48 rounded-xl object-cover" />
                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-md">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-sand-300 cursor-pointer hover:border-forest-400 hover:bg-forest-50 transition-colors">
                <ImageIcon className="h-8 w-8 text-forest-300 mb-2" />
                <span className="text-sm text-forest-500">Cliquez pour ajouter une photo</span>
                <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
              </label>
            )}
          </div>
        </Card>

        <div className="flex gap-3">
          <Link to="/signalements" className="btn-secondary flex-1">Annuler</Link>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Envoi…' : 'Publier le signalement'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}

export function SignalementDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [signalement, setSignalement] = useState<Signalement | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<SignalementStatus>('en_attente');

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('signalements')
        .select('*, communes(name), profiles(full_name, role)')
        .eq('id', id)
        .maybeSingle();
      setSignalement(data as Signalement | null);
      if (data && user) {
        const { data: vote } = await supabase.from('votes_signalements').select('id').eq('user_id', user.id).eq('signalement_id', id).maybeSingle();
        setHasVoted(!!vote);
      }
      setLoading(false);
    })();
  }, [id, user]);

  async function handleVote() {
    if (!user || !signalement) return;
    setVoteLoading(true);
    if (hasVoted) {
      await supabase.from('votes_signalements').delete().eq('user_id', user.id).eq('signalement_id', signalement.id);
      await supabase.from('signalements').update({ votes: Math.max(0, signalement.votes - 1) }).eq('id', signalement.id);
      setHasVoted(false);
      setSignalement({ ...signalement, votes: signalement.votes - 1 });
    } else {
      await supabase.from('votes_signalements').insert({ user_id: user.id, signalement_id: signalement.id });
      await supabase.from('signalements').update({ votes: signalement.votes + 1 }).eq('id', signalement.id);
      setHasVoted(true);
      setSignalement({ ...signalement, votes: signalement.votes + 1 });
    }
    setVoteLoading(false);
  }

  async function handleStatusUpdate() {
    if (!signalement || !user) return;
    const update: Partial<Signalement> = { status: newStatus };
    if (newStatus === 'resolu') update.resolved_at = new Date().toISOString();
    const { error } = await supabase.from('signalements').update(update).eq('id', signalement.id);
    if (!error) {
      setSignalement({ ...signalement, ...update });
      setStatusModal(false);
    }
  }

  async function handleDelete() {
    if (!signalement || !user) return;
    if (!confirm('Supprimer ce signalement ? Cette action est irréversible.')) return;
    await supabase.from('signalements').delete().eq('id', signalement.id);
    navigate('/signalements');
  }

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><LoadingState /></div>;
  if (!signalement) return <div className="mx-auto max-w-4xl px-4 py-8"><EmptyState icon={<AlertTriangle className="h-12 w-12" />} title="Signalement introuvable" /></div>;

  const Icon = TYPE_ICONS[signalement.type];
  const isOwner = user?.id === signalement.user_id;
  const currentRole = signalement.profiles?.role;
  const canManageStatus = currentRole === 'admin' || currentRole === 'autorite' || currentRole === 'collecteur';
  const canDelete = isOwner && signalement.status === 'en_attente';

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <Link to="/signalements" className="inline-flex items-center gap-1.5 text-sm font-medium text-forest-600 hover:text-forest-700 mb-4">
        <ArrowLeft className="h-4 w-4" /> Retour
      </Link>

      {signalement.photo_url && (
        <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 bg-sand-100">
          <img src={signalement.photo_url} alt={signalement.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sand-100 text-forest-700">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <span className={classNames(SIGNALEMENT_STATUS_COLORS[signalement.status])}>{SIGNALEMENT_STATUS_LABELS[signalement.status]}</span>
                <h1 className="font-display text-2xl font-bold text-forest-900 mt-1">{signalement.title}</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-forest-500 mb-4">
              <span className="badge-sand">{SIGNALEMENT_TYPE_LABELS[signalement.type]}</span>
              {signalement.communes && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{signalement.communes.name}</span>}
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{formatDateTime(signalement.created_at)}</span>
            </div>
            <p className="text-forest-700 leading-relaxed whitespace-pre-wrap">{signalement.description}</p>
            <div className="mt-6 pt-4 border-t border-sand-200 flex items-center justify-between">
              <div className="text-sm text-forest-500">
                Signalé par <span className="font-medium text-forest-700">{signalement.profiles?.full_name ?? 'Anonyme'}</span>
              </div>
              <button onClick={handleVote} disabled={!user || voteLoading}
                className={classNames('btn', hasVoted ? 'bg-forest-600 text-white' : 'bg-[#f7f6f1] border border-sand-300 text-forest-700 hover:bg-forest-50')}>
                <ThumbsUp className="h-4 w-4" />
                {signalement.votes} {hasVoted ? 'Voté' : 'Voter'}
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-display font-semibold text-forest-900 mb-3">Coordonnées GPS</h3>
            <div className="text-sm text-forest-600 space-y-1">
              <p>Latitude: {signalement.latitude.toFixed(5)}</p>
              <p>Longitude: {signalement.longitude.toFixed(5)}</p>
            </div>
            <Link to="/carte" className="btn-ghost mt-3 w-full text-sm">
              <MapPin className="h-4 w-4" /> Voir sur la carte
            </Link>
          </Card>

          {canManageStatus && (
            <Card className="p-5">
              <h3 className="font-display font-semibold text-forest-900 mb-3">Gestion</h3>
              <button onClick={() => { setNewStatus(signalement.status); setStatusModal(true); }} className="btn-secondary w-full mb-2">
                Modifier le statut
              </button>
              {canDelete && (
                <button onClick={handleDelete} className="btn-danger w-full">
                  <Trash2 className="h-4 w-4" /> Supprimer
                </button>
              )}
            </Card>
          )}
        </div>
      </div>

      <Modal open={statusModal} onClose={() => setStatusModal(false)} title="Modifier le statut">
        <div className="space-y-4">
          <div>
            <label className="label">Nouveau statut</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as SignalementStatus)} className="input">
              <option value="en_attente">En attente</option>
              <option value="en_cours">En cours</option>
              <option value="resolu">Résolu</option>
              <option value="rejete">Rejeté</option>
            </select>
          </div>
          <button onClick={handleStatusUpdate} className="btn-primary w-full">Confirmer</button>
        </div>
      </Modal>
    </div>
  );
}
