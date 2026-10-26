/**
 * Monitoring Locations Map
 * 
 * Interactive map powered by Leaflet & OpenStreetMap.
 * Displays authorized monitoring sites, active incident clusters,
 * CPCB zone category filters, and an inspection side-panel.
 * Clean, light environmental design without icons or mirror/glass filters.
 */

import { useState, useEffect, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationsAPI, incidentsAPI } from '../services/api';
import { Link } from 'react-router-dom';

// Fix standard Leaflet default icon URL issues with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Clean circular pinpoint marker without icons
const createCustomMarker = (severity, isSelected) => {
  const color = severity === 'high' ? '#d97706' : severity === 'medium' ? '#b45309' : '#059669';
  const size = isSelected ? 22 : 16;
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 9999px;
        border: 2.5px solid #ffffff;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.35);
        cursor: pointer;
        transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
        transition: transform 0.2s ease;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const getZoneLimits = (zone) => {
  switch (zone?.toLowerCase()) {
    case 'commercial': return { day: 65, night: 55 };
    case 'industrial': return { day: 75, night: 70 };
    case 'silent':
    case 'silence_zone': return { day: 50, night: 40 };
    case 'residential':
    default: return { day: 55, night: 45 };
  }
};

// Sub-component to dynamically fly/pan the map when selected location changes
function MapViewController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 13, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [zoneFilter, setZoneFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Load locations and incidents
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [locRes, incRes] = await Promise.all([
          locationsAPI.list(),
          incidentsAPI.list(),
        ]);
        const items = locRes.data.items || [];
        setLocations(items);
        setIncidents(incRes.data.items || []);
        if (items.length > 0) {
          setSelectedLocation(items[0]);
        }
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter locations
  const filteredLocations = locations.filter((loc) => {
    if (zoneFilter !== 'all' && loc.zone_category !== zoneFilter) return false;
    return true;
  });

  const selectedLimits = getZoneLimits(selectedLocation?.zone_category);
  const activeCenter = selectedLocation 
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : [19.0760, 72.8777];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      
      {/* ── Header & Privacy Banner ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
            Acoustic Monitoring Site Network
          </h1>
          <p className="text-xs text-[#475569] mt-1">
            Geographic distribution of municipal and automated acoustic monitoring stations across India
          </p>
        </div>

        {/* Privacy Note without icons */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e2e8f0] text-xs text-[#475569] font-medium shadow-xs">
          <span className="badge-emerald text-[10px]">Notice</span>
          <span>Residential locations anonymized to protect citizen privacy</span>
        </div>
      </div>

      {/* ── Filter Bar (Solid White, No Mirror Filter) ────────────── */}
      <div className="bg-white border border-[#e2e8f0] p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#475569] font-bold uppercase tracking-wider mr-2">
            Zone Type:
          </span>
          {['all', 'residential', 'commercial', 'industrial', 'silent'].map((zone) => (
            <button
              key={zone}
              onClick={() => {
                setZoneFilter(zone);
                const match = locations.find(l => zone === 'all' || l.zone_category === zone);
                if (match) setSelectedLocation(match);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                zoneFilter === zone
                  ? 'bg-[#059669] text-white shadow-sm'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
              }`}
            >
              {zone}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#475569] font-mono font-medium bg-[#f1f5f9] px-3.5 py-1.5 rounded-full border border-[#e2e8f0]">
          Showing {filteredLocations.length} Active Monitoring Sites
        </div>
      </div>

      {/* ── Map Container & Details Side Panel ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaflet Map (2 Columns, Solid Card, No Mirror Filter) */}
        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] p-3 rounded-3xl h-[580px] relative overflow-hidden shadow-xs">
          <MapContainer
            center={activeCenter}
            zoom={13}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Dynamic Map Controller for smooth pan/zoom */}
            <MapViewController center={activeCenter} zoom={13} />

            {/* Markers properly mounted using React Fragment (No div wrapper) */}
            {filteredLocations.map((loc) => {
              const siteIncidents = incidents.filter((i) => i.location_id === loc.id);
              const hasHighSev = siteIncidents.some((i) => i.severity === 'high');
              const severity = hasHighSev ? 'high' : siteIncidents.length > 0 ? 'medium' : 'low';
              const isSelected = selectedLocation?.id === loc.id;

              return (
                <Fragment key={loc.id}>
                  {/* Visual zone radius circle */}
                  <Circle
                    center={[loc.latitude, loc.longitude]}
                    radius={500}
                    pathOptions={{
                      color: severity === 'high' ? '#d97706' : '#059669',
                      fillColor: severity === 'high' ? '#d97706' : '#059669',
                      fillOpacity: isSelected ? 0.22 : 0.12,
                      weight: isSelected ? 2.5 : 1.5,
                    }}
                  />

                  {/* Marker Pinpoint */}
                  <Marker
                    position={[loc.latitude, loc.longitude]}
                    icon={createCustomMarker(severity, isSelected)}
                    eventHandlers={{
                      click: () => setSelectedLocation(loc),
                    }}
                  >
                    <Popup>
                      <div className="p-1 space-y-1">
                        <div className="font-bold text-xs text-[#0f172a]">{loc.name}</div>
                        <div className="text-[11px] text-[#475569] capitalize">CPCB Zone: {loc.zone_category}</div>
                        <div className="text-[11px] text-[#475569]">Day Limit: {loc.day_threshold_dba} dB(A)</div>
                        <div className="text-[10px] text-[#475569] font-mono">Site ID: {loc.id}</div>
                      </div>
                    </Popup>
                  </Marker>
                </Fragment>
              );
            })}
          </MapContainer>

          {/* Map Legend (Solid White, No Mirror Blur) */}
          <div className="absolute bottom-6 left-6 z-[1000] bg-white border border-[#cbd5e1] rounded-2xl p-4 text-[11px] space-y-2 shadow-md">
            <div className="font-bold text-xs text-[#0f172a] mb-1">Severity Legend</div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d97706]" />
              <span className="text-[#475569]">High Exceedance ({'>'}15 dB)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#b45309]" />
              <span className="text-[#475569]">Moderate Exceedance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              <span className="text-[#475569]">Within Statutory Limit</span>
            </div>
          </div>
        </div>

        {/* Selected Location Inspection Panel (Solid White, No Mirror Filter) */}
        <div className="bg-white border border-[#e2e8f0] p-6 rounded-3xl flex flex-col justify-between shadow-xs">
          {selectedLocation ? (
            <div className="space-y-5">
              <div>
                <span className="badge-emerald mb-2">
                  {selectedLocation.zone_category} ZONE (INDIA)
                </span>
                <h2 className="text-lg font-bold text-[#0f172a] mt-2">
                  {selectedLocation.name}
                </h2>
                <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                  {selectedLocation.description || 'Continuous ambient acoustic screening station.'}
                </p>
              </div>

              {/* Threshold & Coordinates Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#475569] block uppercase font-medium">Day Threshold</span>
                  <span className="text-base font-mono font-bold text-[#047857]">
                    {selectedLocation.day_threshold_dba || selectedLimits.day} dB(A)
                  </span>
                </div>
                <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#475569] block uppercase font-medium">Night Threshold</span>
                  <span className="text-base font-mono font-bold text-[#334155]">
                    {selectedLocation.night_threshold_dba || selectedLimits.night} dB(A)
                  </span>
                </div>
              </div>

              {/* Coordinates info */}
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] text-xs font-mono space-y-1">
                <div className="text-[#475569] text-[10px] uppercase font-semibold">GPS Coordinates</div>
                <div className="text-[#0f172a]">Lat: {selectedLocation.latitude.toFixed(4)}° N</div>
                <div className="text-[#0f172a]">Lon: {selectedLocation.longitude.toFixed(4)}° E</div>
              </div>

              {/* Quick Jump List to Switch Monitoring Sites */}
              <div>
                <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-2">
                  Select Monitoring Station
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {filteredLocations.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => setSelectedLocation(site)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                        selectedLocation?.id === site.id
                          ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#047857] font-bold'
                          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#334155] hover:bg-[#f1f5f9]'
                      }`}
                    >
                      <span className="truncate">{site.name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white border border-[#cbd5e1]">
                        {site.zone_category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked Incidents for this location */}
              <div>
                <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-2">
                  Active Site Incidents
                </h4>
                {incidents.filter((i) => i.location_id === selectedLocation.id).length > 0 ? (
                  <div className="space-y-2">
                    {incidents
                      .filter((i) => i.location_id === selectedLocation.id)
                      .slice(0, 2)
                      .map((inc) => (
                        <div
                          key={inc.id}
                          className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-[#d97706]">
                              {inc.measured_value} dB(A)
                            </div>
                            <div className="text-[10px] text-[#475569]">
                              {inc.sound_classification || 'Industrial/Machinery'}
                            </div>
                          </div>
                          <Link
                            to={`/incidents/${inc.id}`}
                            className="btn btn-secondary btn-sm py-1 px-3 text-[11px] rounded-full"
                          >
                            Inspect Dossier
                          </Link>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#475569] italic p-3 rounded-2xl bg-[#f8fafc] text-center border border-[#e2e8f0]">
                    No active exceedance flags at this site.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-[#475569]">
              Click any site marker on the map to inspect telemetry.
            </div>
          )}

          <div className="pt-4 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-medium">
            <span className="text-[#475569]">Operational Status:</span>
            <span className="font-semibold text-[#059669] flex items-center gap-1.5">
              <span className="status-dot status-dot--active" /> Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
