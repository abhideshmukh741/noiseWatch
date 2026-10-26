/**
 * Monitoring Locations Map
 * 
 * Interactive map powered by Leaflet & OpenStreetMap.
 * Displays authorized monitoring sites, active incident clusters,
 * CPCB zone category filters, city/region switcher, and an inspection side-panel.
 * Clean, light environmental design without icons or mirror/glass filters.
 */

import { useState, useEffect, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationsAPI, incidentsAPI, audioAPI } from '../services/api';
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

// Distinct User GPS marker with pulsating ring
const createUserGpsMarker = () => {
  return L.divIcon({
    className: 'user-gps-marker',
    html: `
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
      ">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background-color: #059669;
          opacity: 0.3;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          background-color: #047857;
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 10px rgba(5, 150, 105, 0.5);
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
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

const INDIAN_CITIES = [
  { id: 'pune', name: 'Pune', center: [18.5204, 73.8567], zoom: 13 },
  { id: 'mumbai', name: 'Mumbai', center: [19.0600, 72.8500], zoom: 13 },
  { id: 'all', name: 'All India', center: [18.7500, 73.3500], zoom: 9 },
];

export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCity, setSelectedCity] = useState('pune');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Live browser GPS state
  const [userGps, setUserGps] = useState(null);
  const [userLocality, setUserLocality] = useState('');
  const [gpsStatus, setGpsStatus] = useState('idle'); // 'detecting', 'found', 'unsupported'

  // 1. Acquire Live User GPS on Mount
  useEffect(() => {
    if (navigator.geolocation) {
      setGpsStatus('detecting');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setUserGps({ lat, lon });
          setGpsStatus('found');
          try {
            const res = await audioAPI.detectZone(lat, lon);
            setUserLocality(res.data.address || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`);
          } catch (e) {
            console.warn('Geocoding error:', e);
          }
        },
        (err) => {
          console.log('User browser geolocation not provided or denied:', err.message);
          setGpsStatus('unsupported');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setGpsStatus('unsupported');
    }
  }, []);

  // 2. Load locations and incidents
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
        
        // Find first Pune location by default (or user location)
        const defaultLoc = items.find(l => l.address?.toLowerCase().includes('pune')) || items[0];
        if (defaultLoc) {
          setSelectedLocation(defaultLoc);
        }
      } catch (err) {
        console.error('Failed to load map data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter locations by City and Zone
  const filteredLocations = locations.filter((loc) => {
    // City filter
    if (selectedCity === 'pune' && !loc.address?.toLowerCase().includes('pune')) {
      return false;
    }
    if (selectedCity === 'mumbai' && !loc.address?.toLowerCase().includes('mumbai')) {
      return false;
    }

    // Zone filter (seamlessly handles 'silent' and 'silence_zone')
    if (zoneFilter !== 'all') {
      if (zoneFilter === 'silent') {
        if (loc.zone_category !== 'silent' && loc.zone_category !== 'silence_zone') return false;
      } else if (loc.zone_category !== zoneFilter) {
        return false;
      }
    }

    return true;
  });

  const selectedLimits = getZoneLimits(selectedLocation?.zone_category);
  
  // Dynamic Map Center
  const activeCenter = selectedLocation 
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : (selectedCity === 'pune' ? [18.5204, 73.8567] : [19.0600, 72.8500]);

  const handleCitySwitch = (cityId) => {
    setSelectedCity(cityId);
    if (cityId === 'user' && userGps) {
      setSelectedLocation({
        id: 'user-live-loc',
        name: 'Your Real-Time GPS Location',
        description: userLocality || 'Current citizen device location',
        latitude: userGps.lat,
        longitude: userGps.lon,
        zone_category: 'residential',
        address: userLocality || 'Current Position',
        day_threshold_dba: 55,
        night_threshold_dba: 45,
      });
      return;
    }

    const cityLocs = locations.filter(l => 
      cityId === 'all' || l.address?.toLowerCase().includes(cityId)
    );
    if (cityLocs.length > 0) {
      setSelectedLocation(cityLocs[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-6">
      
      {/* ── Header & Privacy Banner ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#e2e8f0]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0f172a]">
            Acoustic Monitoring Site Network
          </h1>
          <p className="text-xs text-[#475569] mt-1">
            Real-time noise compliance mapping across Indian cities and live GPS coordinates
          </p>
        </div>

        {/* Live GPS status pill */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e2e8f0] text-xs text-[#475569] font-medium shadow-xs">
          <span className="badge-emerald text-[10px]">
            {userGps ? 'GPS ACTIVE' : 'INDIAN NETWORK'}
          </span>
          <span>
            {userGps 
              ? `Live at: ${userLocality ? userLocality.slice(0, 36) + '...' : `${userGps.lat.toFixed(3)}°, ${userGps.lon.toFixed(3)}°`}`
              : 'Pune / Maharashtra Municipal Baseline'}
          </span>
        </div>
      </div>

      {/* ── City / Region Selector Bar (Zero Icons, Solid Cards) ───── */}
      <div className="bg-white border border-[#e2e8f0] p-4 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[#475569] font-bold uppercase tracking-wider mr-2">
            Region / City:
          </span>

          {userGps && (
            <button
              onClick={() => handleCitySwitch('user')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCity === 'user'
                  ? 'bg-[#059669] text-white shadow-sm'
                  : 'bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-[#d1fae5]'
              }`}
            >
              My Current GPS Location
            </button>
          )}

          {INDIAN_CITIES.map((city) => (
            <button
              key={city.id}
              onClick={() => handleCitySwitch(city.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedCity === city.id
                  ? 'bg-[#059669] text-white shadow-sm'
                  : 'bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0]'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Zone Filters with fixed Silence Zone mapping */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#475569] font-bold uppercase tracking-wider mr-2">
            Zone:
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'residential', label: 'Residential' },
            { id: 'commercial', label: 'Commercial' },
            { id: 'industrial', label: 'Industrial' },
            { id: 'silent', label: 'Silence Zone' },
          ].map((zone) => (
            <button
              key={zone.id}
              onClick={() => setZoneFilter(zone.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all ${
                zoneFilter === zone.id
                  ? 'bg-[#0f172a] text-white'
                  : 'bg-[#f8fafc] border border-[#cbd5e1] text-[#475569] hover:bg-[#f1f5f9]'
              }`}
            >
              {zone.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#475569] font-mono font-medium bg-[#f1f5f9] px-3.5 py-1.5 rounded-full border border-[#e2e8f0]">
          Showing {filteredLocations.length} Active Stations
        </div>
      </div>

      {/* ── Map Container & Details Side Panel ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Leaflet Map (2 Columns, Solid White Card, No Mirror Filter) */}
        <div className="lg:col-span-2 bg-white border border-[#e2e8f0] p-3 rounded-3xl h-[580px] relative overflow-hidden shadow-xs">
          <MapContainer
            center={activeCenter}
            zoom={selectedCity === 'all' ? 9 : 13}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Dynamic Map Controller for smooth pan/zoom */}
            <MapViewController center={activeCenter} zoom={selectedCity === 'all' ? 9 : 13} />

            {/* User's Live Real-Time GPS Marker (if allowed by browser) */}
            {userGps && (
              <Marker
                position={[userGps.lat, userGps.lon]}
                icon={createUserGpsMarker()}
              >
                <Popup>
                  <div className="p-1 space-y-1">
                    <div className="font-bold text-xs text-[#047857]">You Are Here (Live Device)</div>
                    <div className="text-[11px] text-[#334155]">{userLocality || 'Current Device Position'}</div>
                    <div className="text-[10px] text-[#64748b] font-mono">
                      {userGps.lat.toFixed(4)}°N, {userGps.lon.toFixed(4)}°E
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Regional Monitoring Station Markers */}
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
                        <div className="text-[11px] text-[#475569]">Day Limit: {loc.day_threshold_dba || 55} dB(A)</div>
                        <div className="text-[10px] text-[#475569] font-mono">Location: {loc.address}</div>
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
            {userGps && (
              <div className="flex items-center gap-2 pt-1 border-t border-[#f1f5f9]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#047857] ring-2 ring-[#a7f3d0]" />
                <span className="text-[#047857] font-bold">Your Live Device</span>
              </div>
            )}
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
                <p className="text-xs font-semibold text-[#0f172a] mt-1">
                  {selectedLocation.address}
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

              {/* Quick Jump List to Switch Monitoring Sites in Selected Region */}
              <div>
                <h4 className="text-xs font-bold text-[#0f172a] uppercase tracking-wider mb-2">
                  Stations in {selectedCity.toUpperCase()}
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
