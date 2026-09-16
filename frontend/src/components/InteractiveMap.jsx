import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create custom colored markers for Leaflet
const createCustomMarker = (colorHex) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${colorHex}" width="32" height="32" stroke="#0f172a" stroke-width="1.5">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>`;
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30]
  });
};

const MARKER_ICONS = {
  Low: createCustomMarker('#10b981'),      // Emerald Green
  Medium: createCustomMarker('#eab308'),   // Yellow
  High: createCustomMarker('#f97316'),     // Orange/Amber
  Critical: createCustomMarker('#ef4444')  // Red
};

export default function InteractiveMap({ projects, onSelectProject }) {
  // Center near Varanasi by default
  const center = [23.5000, 80.5000];

  return (
    <div className="w-full h-[420px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={false}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {projects.map((p) => {
          const band = p.risk_band || 'Low';
          const icon = MARKER_ICONS[band] || MARKER_ICONS['Low'];

          return (
            <Marker key={p.id} position={[p.lat, p.lng]} icon={icon}>
              <Popup className="mplad-map-popup">
                <div className="p-1 max-w-xs text-slate-900">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border text-slate-700">
                      {p.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white ${
                      band === 'Critical' ? 'bg-red-600' :
                      band === 'High' ? 'bg-orange-500' :
                      band === 'Medium' ? 'bg-amber-500' : 'bg-emerald-600'
                    }`}>
                      {band} Risk ({p.risk_score})
                    </span>
                  </div>

                  <h4 className="font-bold text-sm leading-tight text-slate-900 mb-1">{p.title}</h4>
                  <p className="text-xs text-slate-600 mb-2">{p.district}, {p.constituency}</p>

                  <div className="grid grid-cols-2 gap-1 text-[11px] bg-slate-50 p-1.5 rounded mb-2 border">
                    <div><span className="text-slate-500">Fund:</span> <strong>₹{p.sanctioned_fund}L</strong></div>
                    <div><span className="text-slate-500">Progress:</span> <strong>{p.current_progress_pct}%</strong></div>
                  </div>

                  <button
                    onClick={() => onSelectProject(p)}
                    className="w-full py-1 text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 rounded transition"
                  >
                    View Project Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Risk Legend Overlay */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-800 p-2.5 rounded-lg text-xs space-y-1 shadow-lg">
        <div className="font-bold text-[11px] text-slate-400 uppercase tracking-wider mb-1">Risk Map Legend</div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span><span className="text-slate-300">0-30 Low Risk</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span><span className="text-slate-300">31-60 Medium Risk</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span><span className="text-slate-300">61-80 High Risk</span></div>
        <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span><span className="text-slate-300">81-100 Critical Risk</span></div>
      </div>
    </div>
  );
}
