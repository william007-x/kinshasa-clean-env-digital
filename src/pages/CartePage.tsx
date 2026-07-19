import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import {
  AlertTriangle, Trash2, Filter, Layers,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  SIGNALEMENT_TYPE_LABELS, SIGNALEMENT_STATUS_LABELS, SIGNALEMENT_STATUS_COLORS,
  type Signalement, type SignalementType, type SignalementStatus, type PointDepot,
} from '../lib/supabase';
import { PageHeader, Card, LoadingState } from '../components/ui';
import { classNames, KINSHASA_CENTER } from '../lib/utils';

(L.Icon.Default.prototype as any)._getIconUrl = false;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_COLORS: Record<SignalementType, string> = {
  depot_sauvage: '#d97742',
  inondation: '#3b82f6',
  erosion: '#a67c52',
  pollution_eau: '#06b6d4',
  pollution_air: '#6366f1',
  autre: '#64748b',
};

function typeIcon(type: SignalementType): L.DivIcon {
  const colors: Record<SignalementType, string> = {
    depot_sauvage: '#d97742',
    inondation: '#3b82f6',
    erosion: '#a67c52',
    pollution_eau: '#06b6d4',
    pollution_air: '#6366f1',
    autre: '#64748b',
  };
  const icons: Record<SignalementType, string> = {
    depot_sauvage: '🗑',
    inondation: '🌊',
    erosion: '⛰',
    pollution_eau: '💧',
    pollution_air: '🌫',
    autre: '⚠',
  };
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${colors[type]};width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);border:2px solid white;"><span style="transform:rotate(45deg);font-size:14px;">${icons[type]}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
}

const { BaseLayer } = LayersControl;

export function CartePage() {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [pointsDepot, setPointsDepot] = useState<PointDepot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<SignalementType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<SignalementStatus | 'all'>('all');
  const [showDepots, setShowDepots] = useState(true);
  const [showSignalements, setShowSignalements] = useState(true);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    (async () => {
      const [sigRes, depotRes] = await Promise.all([
        supabase.from('signalements').select('*, communes(name)').order('created_at', { ascending: false }).limit(500),
        supabase.from('points_depot').select('*, communes(name)'),
      ]);
      setSignalements((sigRes.data as Signalement[]) ?? []);
      setPointsDepot((depotRes.data as PointDepot[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filteredSig = signalements.filter((s) => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <PageHeader
        title="Carte interactive"
        subtitle="Visualisez les incidents environnementaux et les points de collecte de Kinshasa"
      />

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-forest-600" />
              <h3 className="font-display font-semibold text-forest-900">Filtres</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Type d'incident</label>
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as SignalementType | 'all')} className="input">
                  <option value="all">Tous les types</option>
                  {Object.entries(SIGNALEMENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Statut</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as SignalementStatus | 'all')} className="input">
                  <option value="all">Tous</option>
                  {Object.entries(SIGNALEMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-4 w-4 text-forest-600" />
              <h3 className="font-display font-semibold text-forest-900">Couches</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={showSignalements} onChange={(e) => setShowSignalements(e.target.checked)} className="h-4 w-4 rounded text-forest-600 focus:ring-forest-500" />
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-earth-600" />
                  <span className="text-sm font-medium text-forest-700">Signalements ({filteredSig.length})</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={showDepots} onChange={(e) => setShowDepots(e.target.checked)} className="h-4 w-4 rounded text-forest-600 focus:ring-forest-500" />
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-forest-600" />
                  <span className="text-sm font-medium text-forest-700">Points de dépôt ({pointsDepot.length})</span>
                </div>
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-display font-semibold text-forest-900 mb-3">Légende</h3>
            <div className="space-y-2 text-xs">
              {Object.entries(SIGNALEMENT_TYPE_LABELS).map(([v, l]) => (
                <div key={v} className="flex items-center gap-2">
                   <span className="h-3 w-3 rounded-full" style={{ backgroundColor: TYPE_COLORS[v as SignalementType] }} />
                  <span className="text-forest-600">{l}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          {loading ? (
            <Card className="h-[600px] flex items-center justify-center"><LoadingState /></Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <MapContainer
                center={KINSHASA_CENTER}
                zoom={12}
                className="h-[600px] w-full"
                ref={(map) => { if (map) mapRef.current = map; }}
              >
                <LayersControl position="topright">
                  <BaseLayer checked name="Standard">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                  </BaseLayer>
                  <BaseLayer name="Satellite">
                    <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; Esri' />
                  </BaseLayer>
                </LayersControl>

                {showSignalements && filteredSig.map((sig) => (
                  <Marker key={sig.id} position={[sig.latitude, sig.longitude]} icon={typeIcon(sig.type)}>
                    <Popup>
                      <div className="min-w-[200px]">
                        <p className="font-semibold text-forest-900">{sig.title}</p>
                        <p className="text-xs text-forest-500 mt-1">{SIGNALEMENT_TYPE_LABELS[sig.type]}</p>
                        <p className="text-xs text-forest-600 mt-2 line-clamp-2">{sig.description}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={classNames(SIGNALEMENT_STATUS_COLORS[sig.status])}>{SIGNALEMENT_STATUS_LABELS[sig.status]}</span>
                          {sig.communes && <span className="text-xs text-forest-400">{sig.communes.name}</span>}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {showDepots && pointsDepot.map((depot) => (
                  <CircleMarker
                    key={depot.id}
                    center={[depot.latitude, depot.longitude]}
                    radius={10}
                    pathOptions={{
                      color: depot.status === 'plein' ? '#ef4444' : depot.status === 'hors_service' ? '#64748b' : '#16a34a',
                      fillColor: depot.status === 'plein' ? '#ef4444' : depot.status === 'hors_service' ? '#64748b' : '#16a34a',
                      fillOpacity: 0.6,
                    }}
                  >
                    <Popup>
                      <div className="min-w-[180px]">
                        <p className="font-semibold text-forest-900">{depot.name}</p>
                        <p className="text-xs text-forest-500 mt-1">Remplissage: {depot.current_fill_pct}%</p>
                        <p className="text-xs text-forest-600">Capacité: {depot.capacity_m3} m³</p>
                        {depot.communes && <p className="text-xs text-forest-400 mt-1">{depot.communes.name}</p>}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
