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

// Clean circular pinpoint marker without icons - Qwilr Palette
const createCustomMarker = (severity, isSelected) => {
  const color = severity === 'high' ? '#ff5757' : severity === 'medium' ? '#f59e0b' : '#00a88f';
  const size = isSelected ? 24 : 16;
  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 9999px;
        border: 2.5px solid #ffffff;
        box-shadow: 0 4px 12px rgba(30, 36, 48, 0.25);
        cursor: pointer;
        transform: ${isSelected ? 'scale(1.18)' : 'scale(1)'};
        transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// Distinct User GPS marker with pulsating ring - Qwilr Teal
const createUserGpsMarker = () => {
  return L.divIcon({
    className: 'user-gps-marker',
    html: `
      <div style="
        position: relative;
        width: 22px;
        height: 22px;
      ">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background-color: #00a88f;
          opacity: 0.35;
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <div style="
          position: relative;
          background-color: #00a88f;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          border: 3px solid #ffffff;
          box-shadow: 0 4px 14px rgba(0, 168, 143, 0.45);
        "></div>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
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
    <div className="min-h-screen bg-[#fafbfc] p-4 sm:p-6 lg:p-8 max-w-[1440px] mx-auto space-y-8">
      
      {/* ── Top Architectural Header & Telemetry Banner ─────────────── */}
      <div className="bg-white border border-[#e2e8f0] p-6 sm:p-8 rounded-tl-[48px] rounded-br-[48px] rounded-tr-2xl rounded-bl-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6f7f4] border border-[#a7f3d0] text-[#00a88f] text-[10px] font-bold tracking-widest uppercase mb-2">
            Acoustic Network Cartography
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1e2430]">
            Monitoring Locations Map
          </h1>
          <p className="text-xs sm:text-sm text-[#58647a] mt-1 max-w-xl">
            Live acoustic compliance cartography across municipal screening stations and browser-calibrated citizen nodes under CPCB Rule 3(1).
          </p>
        </div>

        {/* Live GPS status capsule */}
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-[#f8fafc] border border-[#e2e8f0] text-xs text-[#58647a] font-medium shadow-xs shrink-0">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            userGps ? 'bg-[#00a88f] text-white shadow-xs' : 'bg-[#1e2430] text-white'
          }`}>
            {userGps ? 'GPS ACTIVE' : 'INDIAN NETWORK'}
          </span>
          <span className="font-mono text-xs text-[#1e2430]">
            {userGps 
              ? `Live: ${userLocality ? userLocality.slice(0, 32) + '...' : `${userGps.lat.toFixed(3)}°N, ${userGps.lon.toFixed(3)}°E`}`
              : 'Pune / Mumbai Urban Network'}
          </span>
        </div>
      </div>

      {/* ── City & Zone Filter Stadium Capsule Bar ─────────────────── */}
      <div className="bg-white border border-[#e2e8f0] p-4 sm:p-5 rounded-full shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[#58647a] font-bold uppercase tracking-wider ml-2 mr-1">
            Region:
          </span>

          {userGps && (
            <button
              onClick={() => handleCitySwitch('user')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                selectedCity === 'user'
                  ? 'bg-[#00a88f] text-white shadow-sm'
                  : 'bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0] hover:bg-[#cbf0ea]'
              }`}
            >
              My GPS Location
            </button>
          )}

          {INDIAN_CITIES.map((city) => (
            <button
              key={city.id}
              onClick={() => handleCitySwitch(city.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                selectedCity === city.id
                  ? 'bg-[#1e2430] text-white shadow-sm'
                  : 'bg-[#f1f5f9] text-[#58647a] hover:bg-[#e2e8f0] hover:text-[#1e2430]'
              }`}
            >
              {city.name}
            </button>
          ))}
        </div>

        {/* Zone Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[#58647a] font-bold uppercase tracking-wider mr-1">
            Zone:
          </span>
          {[
            { id: 'all', label: 'All Zones' },
            { id: 'residential', label: 'Residential' },
            { id: 'commercial', label: 'Commercial' },
            { id: 'industrial', label: 'Industrial' },
            { id: 'silent', label: 'Silence Zone' },
          ].map((zone) => (
            <button
              key={zone.id}
              onClick={() => setZoneFilter(zone.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-200 ${
                zoneFilter === zone.id
                  ? 'bg-[#00a88f] text-white shadow-xs'
                  : 'bg-[#f8fafc] border border-[#e2e8f0] text-[#58647a] hover:bg-[#f1f5f9] hover:text-[#1e2430]'
              }`}
            >
              {zone.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#58647a] font-mono font-medium bg-[#f1f5f9] px-4 py-2 rounded-full border border-[#e2e8f0] mr-2">
          {filteredLocations.length} Stations Active
        </div>
      </div>

      {/* ── Main Map Canvas & Inspection Dossier (Non-Cube Grid) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Leaflet Map: Cathedral Arch Portal (`shape-arch`) */}
        <div className="lg:col-span-2 shape-arch bg-white border border-[#e2e8f0] p-4 sm:p-5 h-[620px] relative overflow-hidden shadow-sm card-hover-interactive">
          <MapContainer
            center={activeCenter}
            zoom={selectedCity === 'all' ? 9 : 13}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', borderTopLeftRadius: '64px', borderTopRightRadius: '64px', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Dynamic Map Controller for smooth pan/zoom */}
            <MapViewController center={activeCenter} zoom={selectedCity === 'all' ? 9 : 13} />

            {/* User's Live Real-Time GPS Marker */}
            {userGps && (
              <Marker
                position={[userGps.lat, userGps.lon]}
                icon={createUserGpsMarker()}
              >
                <Popup>
                  <div className="p-2 space-y-1 font-sans">
                    <div className="font-bold text-xs text-[#00a88f]">Active Device Location</div>
                    <div className="text-[11px] text-[#1e2430]">{userLocality || 'Current Device Coordinates'}</div>
                    <div className="text-[10px] text-[#58647a] font-mono">
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
                      color: severity === 'high' ? '#ff5757' : '#00a88f',
                      fillColor: severity === 'high' ? '#ff5757' : '#00a88f',
                      fillOpacity: isSelected ? 0.25 : 0.12,
                      weight: isSelected ? 3 : 1.5,
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
                      <div className="p-2 space-y-1 font-sans">
                        <div className="font-bold text-xs text-[#1e2430]">{loc.name}</div>
                        <div className="text-[11px] text-[#58647a] capitalize">CPCB Zone: {loc.zone_category}</div>
                        <div className="text-[11px] text-[#58647a]">Permissible Limit: {loc.day_threshold_dba || 55} dB(A)</div>
                        <div className="text-[10px] text-[#58647a] font-mono">{loc.address}</div>
                      </div>
                    </Popup>
                  </Marker>
                </Fragment>
              );
            })}
          </MapContainer>

          {/* Map Legend: Floating Stadium Pill Container */}
          <div className="absolute bottom-8 left-8 z-[1000] bg-white border border-[#e2e8f0] rounded-3xl p-4 text-[11px] space-y-2 shadow-lg">
            <div className="font-bold text-xs text-[#1e2430] mb-1.5 uppercase tracking-wider">CPCB Compliance Legend</div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5757] shrink-0" />
              <span className="text-[#58647a]">Exceedance ({'>'}15 dB above limit)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b] shrink-0" />
              <span className="text-[#58647a]">Moderate Exceedance</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#00a88f] shrink-0" />
              <span className="text-[#58647a]">Within Statutory Limit</span>
            </div>
            {userGps && (
              <div className="flex items-center gap-2.5 pt-1.5 border-t border-[#f1f5f9]">
                <span className="w-3 h-3 rounded-full bg-[#00a88f] ring-2 ring-[#a7f3d0] shrink-0" />
                <span className="text-[#00a88f] font-bold">Your Live Device</span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Location Inspection Dossier: Inverted Arch / Pebble (`shape-arch-inverted`) */}
        <div className="shape-arch-inverted bg-white border border-[#e2e8f0] p-6 sm:p-8 flex flex-col justify-between shadow-sm card-hover-interactive space-y-6">
          {selectedLocation ? (
            <div className="space-y-6">
              <div>
                <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#e6f7f4] text-[#00a88f] border border-[#a7f3d0] mb-3">
                  {selectedLocation.zone_category} ZONE (INDIA)
                </span>
                <h2 className="text-xl font-bold text-[#1e2430] tracking-tight">
                  {selectedLocation.name}
                </h2>
                <p className="text-xs text-[#58647a] mt-1.5 leading-relaxed">
                  {selectedLocation.description || 'Continuous ambient acoustic screening station.'}
                </p>
                <p className="text-xs font-semibold text-[#1e2430] mt-1 font-mono">
                  {selectedLocation.address}
                </p>
              </div>

              {/* Threshold & Coordinates Grid (Stadium Pill Tokens) */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#58647a] block uppercase font-bold tracking-wider">Day Limit</span>
                  <span className="text-xl font-mono font-bold text-[#00a88f] mt-1 block">
                    {selectedLocation.day_threshold_dba || selectedLimits.day} <span className="text-xs font-sans font-normal text-[#58647a]">dB(A)</span>
                  </span>
                  <span className="text-[10px] text-[#58647a] block mt-0.5">06:00 - 22:00</span>
                </div>
                <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0]">
                  <span className="text-[10px] text-[#58647a] block uppercase font-bold tracking-wider">Night Limit</span>
                  <span className="text-xl font-mono font-bold text-[#1e2430] mt-1 block">
                    {selectedLocation.night_threshold_dba || selectedLimits.night} <span className="text-xs font-sans font-normal text-[#58647a]">dB(A)</span>
                  </span>
                  <span className="text-[10px] text-[#58647a] block mt-0.5">22:00 - 06:00</span>
                </div>
              </div>

              {/* Coordinates Pill */}
              <div className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] text-xs font-mono space-y-1">
                <div className="text-[#58647a] text-[10px] uppercase font-bold tracking-wider">Statutory Coordinates</div>
                <div className="text-[#1e2430] font-bold">Lat: {selectedLocation.latitude.toFixed(4)}° N</div>
                <div className="text-[#1e2430] font-bold">Lon: {selectedLocation.longitude.toFixed(4)}° E</div>
              </div>

              {/* Stations List in Selected Region */}
              <div>
                <h4 className="text-xs font-bold text-[#1e2430] uppercase tracking-wider mb-2.5">
                  Stations in {selectedCity.toUpperCase()}
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {filteredLocations.map((site) => (
                    <button
                      key={site.id}
                      onClick={() => setSelectedLocation(site)}
                      className={`w-full text-left p-3 rounded-2xl border text-xs font-medium transition-all flex items-center justify-between ${
                        selectedLocation?.id === site.id
                          ? 'bg-[#e6f7f4] border-[#a7f3d0] text-[#00a88f] font-bold shadow-xs'
                          : 'bg-[#f8fafc] border-[#e2e8f0] text-[#58647a] hover:bg-[#f1f5f9] hover:text-[#1e2430]'
                      }`}
                    >
                      <span className="truncate">{site.name}</span>
                      <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-white border border-[#e2e8f0]">
                        {site.zone_category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked Incidents for this location */}
              <div>
                <h4 className="text-xs font-bold text-[#1e2430] uppercase tracking-wider mb-2.5">
                  Active Site Incidents
                </h4>
                {incidents.filter((i) => i.location_id === selectedLocation.id).length > 0 ? (
                  <div className="space-y-2.5">
                    {incidents
                      .filter((i) => i.location_id === selectedLocation.id)
                      .slice(0, 2)
                      .map((inc) => (
                        <div
                          key={inc.id}
                          className="p-4 rounded-3xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-mono font-bold text-[#ff5757]">
                              {inc.measured_value} dB(A)
                            </div>
                            <div className="text-[10px] text-[#58647a]">
                              {inc.sound_classification || 'Industrial/Machinery'}
                            </div>
                          </div>
                          <Link
                            to={`/incidents/${inc.id}`}
                            className="px-4 py-1.5 rounded-full text-xs font-bold bg-[#1e2430] text-white hover:bg-black transition-colors"
                          >
                            Inspect Dossier
                          </Link>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#58647a] italic p-4 rounded-3xl bg-[#f8fafc] text-center border border-[#e2e8f0]">
                    No active exceedance flags registered at this site.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-[#58647a]">
              Select any site marker on the map to inspect telemetry dossier.
            </div>
          )}

          <div className="pt-4 border-t border-[#e2e8f0] flex items-center justify-between text-xs font-medium">
            <span className="text-[#58647a]">Station Health:</span>
            <span className="font-semibold text-[#00a88f] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00a88f] inline-block animate-pulse" /> Continuous Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
