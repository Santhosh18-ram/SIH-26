import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Plus, CheckCircle2, AlertTriangle, Clock, 
  Send, Layers, TreePine, Home, FileText, Sparkles, Navigation, Search, Check, RefreshCw
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PRESET_RENDERS = [
  { label: 'Modern School Building (3D)', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&q=80' },
  { label: 'Community Hall & Auditorium (3D)', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=800&q=80' },
  { label: 'Hospital & Health Centre (3D)', url: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=800&q=80' },
  { label: 'Highway & Paved Road (3D)', url: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800&q=80' }
];

const PRESET_LOCATIONS = [
  { name: 'Varanasi Cantt, UP', lat: 25.3280, lng: 82.9850, district: 'Varanasi', constituency: 'Varanasi Cantt' },
  { name: 'Jaipur Rural, RJ', lat: 26.9855, lng: 75.8513, district: 'Jaipur', constituency: 'Jaipur Rural' },
  { name: 'Bengaluru South, KA', lat: 12.9250, lng: 77.5938, district: 'Bengaluru Urban', constituency: 'Bengaluru South' },
  { name: 'Thane Central, MH', lat: 19.2183, lng: 72.9781, district: 'Thane', constituency: 'Thane Central' }
];

function LocationPickerMapEvents({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AgencyDashboard({ onProjectCreated }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Roads & Bridges');
  const [scopeUnit, setScopeUnit] = useState('km');
  const [scopeValue, setScopeValue] = useState(3.0);
  const [terrainType, setTerrainType] = useState('Rural');
  const [district, setDistrict] = useState('Varanasi');
  const [constituency, setConstituency] = useState('Varanasi Cantt');
  const [lat, setLat] = useState(25.3340);
  const [lng, setLng] = useState(82.9810);
  const [estimatedFund, setEstimatedFund] = useState(48.0);
  const [estimatedDays, setEstimatedDays] = useState(120);
  const [agencyName, setAgencyName] = useState('Public Works Department (PWD) Division');
  const [contractorName, setContractorName] = useState('National Highway & Infra Ltd');
  const [proposerContact, setProposerContact] = useState('er.alok.pwd@up.gov.in / +91 94150 88214');
  const [treesToCut, setTreesToCut] = useState(0);
  const [buildingsToDemolish, setBuildingsToDemolish] = useState(0);
  const [demolitionDetails, setDemolitionDetails] = useState('');
  const [futureVisualizationUrl, setFutureVisualizationUrl] = useState(PRESET_RENDERS[3].url);

  const [peerBenchmark, setPeerBenchmark] = useState(null);
  const [checkingBenchmark, setCheckingBenchmark] = useState(false);

  useEffect(() => {
    if (category === 'Roads & Bridges') {
      setScopeUnit('km');
      setScopeValue(3.0);
    } else if (category === 'Street Lighting' || category === 'Water & Sanitation') {
      setScopeUnit('units');
      setScopeValue(100.0);
    } else {
      setScopeUnit('sqft');
      setScopeValue(6000.0);
    }
  }, [category]);

  useEffect(() => {
    const fetchBenchmark = async () => {
      if (!category || !scopeValue || !estimatedFund || scopeValue <= 0) return;
      setCheckingBenchmark(true);
      try {
        const res = await fetch('/api/sanction-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category,
            scope_unit: scopeUnit,
            scope_value: parseFloat(scopeValue),
            terrain_type: terrainType,
            requested_amount: parseFloat(estimatedFund),
            district
          })
        });
        if (res.ok) {
          const data = await res.json();
          setPeerBenchmark(data);
        }
      } catch (err) {
        console.warn('Peer check error:', err);
      } finally {
        setCheckingBenchmark(false);
      }
    };

    const timeout = setTimeout(fetchBenchmark, 400);
    return () => clearTimeout(timeout);
  }, [category, scopeUnit, scopeValue, terrainType, estimatedFund, district]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects/proposals');
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch (err) {
      console.warn('Error fetching proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleLocationSelect = (newLat, newLng) => {
    setLat(parseFloat(newLat.toFixed(6)));
    setLng(parseFloat(newLng.toFixed(6)));
  };

  const handlePresetLocation = (loc) => {
    setLat(loc.lat);
    setLng(loc.lng);
    setDistrict(loc.district);
    setConstituency(loc.constituency);
  };

  const handleSubmitProposal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        category,
        scope_unit: scopeUnit,
        scope_value: parseFloat(scopeValue),
        terrain_type: terrainType,
        district,
        constituency,
        lat,
        lng,
        estimated_fund: parseFloat(estimatedFund),
        estimated_days: parseInt(estimatedDays),
        agency_name: agencyName,
        contractor_name: contractorName,
        proposer_contact: proposerContact,
        trees_to_cut: parseInt(treesToCut) || 0,
        buildings_to_demolish: parseInt(buildingsToDemolish) || 0,
        demolition_details: demolitionDetails,
        future_visualization_url: futureVisualizationUrl
      };

      const res = await fetch('/api/projects/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to submit proposal');
      }

      const data = await res.json();
      setSuccessMessage(`Project proposal '${title}' submitted successfully! Queued for MP / MLA review.`);
      setTitle('');
      setDescription('');
      fetchProposals();
      if (onProjectCreated) onProjectCreated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Executing Agency & Contractor Portal</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Proposer Mode
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Submit new MPLAD infrastructure proposals with GPS geotagging, environmental declarations, and AI peer cost benchmarking.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-purple-500/30 rounded-xl p-3 text-xs space-y-1">
            <div className="text-slate-400">Official Proposing Profile:</div>
            <div className="font-semibold text-white flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Er. Alok Verma (Executive Engineer)</span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">State PWD & Rural Development Wing</div>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex items-center justify-between text-emerald-300">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="text-xs text-emerald-400 hover:text-white px-2 py-1 bg-emerald-900/40 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Proposal Form + Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form: 7 Cols */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Propose New Construction Project</h2>
            </div>
            <span className="text-xs text-slate-400">Sent to MP / MLA for sanction approval</span>
          </div>

          <form onSubmit={handleSubmitProposal} className="space-y-5">
            
            {/* Project Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Project Title & Scope Summary *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Construction of 4-Lane RCC Flyover Approach Road"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Detailed Engineering & Work Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe scope, benefits, material grades, soil condition, and expected community beneficiaries..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Category & Terrain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Roads & Bridges">Roads & Bridges</option>
                  <option value="Schools & Education">Schools & Education</option>
                  <option value="Community Halls">Community Halls</option>
                  <option value="Health & Hospitals">Health & Hospitals</option>
                  <option value="Water & Sanitation">Water & Sanitation</option>
                  <option value="Street Lighting">Street Lighting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Terrain Type *</label>
                <select
                  value={terrainType}
                  onChange={(e) => setTerrainType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Rural">Rural</option>
                  <option value="Urban">Urban</option>
                  <option value="Hilly / Mountainous">Hilly / Mountainous</option>
                  <option value="Flood-Prone / Coastal">Flood-Prone / Coastal</option>
                </select>
              </div>
            </div>

            {/* Scope Value & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Scope Dimension ({scopeUnit}) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Scope Unit</label>
                <input
                  type="text"
                  disabled
                  value={scopeUnit.toUpperCase()}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-400 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Budget & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Proposed Budget (₹ Lakhs) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-sm text-slate-500">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={estimatedFund}
                    onChange={(e) => setEstimatedFund(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-sm font-bold text-cyan-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Completion (Days) *
                </label>
                <input
                  type="number"
                  required
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* AI Sanction Benchmark Live Alert */}
            {peerBenchmark && (
              <div className={`p-3.5 rounded-xl border text-xs ${
                peerBenchmark.is_flagged 
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200' 
                  : 'bg-slate-950 border-cyan-500/30 text-slate-300'
              }`}>
                <div className="flex items-center justify-between font-semibold mb-1">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>AI mplads.gov.in Peer Benchmark Check:</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    peerBenchmark.is_flagged ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {peerBenchmark.risk_level} ({peerBenchmark.multiplier_ratio}x)
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">{peerBenchmark.explanation_text}</p>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center space-x-3">
                  <span>Typical Benchmark: ₹{peerBenchmark.peer_metrics.typical_total_cost_min}L – ₹{peerBenchmark.peer_metrics.typical_total_cost_max}L</span>
                  <span>•</span>
                  <span>Comparable Works: {peerBenchmark.peer_metrics.peer_count}</span>
                </div>
              </div>
            )}

            {/* Environmental Declaration */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                <TreePine className="w-4 h-4" />
                <span>Environmental & Demolition Shield Declarations</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Allowed Trees to Cut (Max)</label>
                  <input
                    type="number"
                    min="0"
                    value={treesToCut}
                    onChange={(e) => setTreesToCut(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Buildings to Demolish</label>
                  <input
                    type="number"
                    min="0"
                    value={buildingsToDemolish}
                    onChange={(e) => setBuildingsToDemolish(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
              {buildingsToDemolish > 0 && (
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Demolition Specification Note</label>
                  <input
                    type="text"
                    value={demolitionDetails}
                    onChange={(e) => setDemolitionDetails(e.target.value)}
                    placeholder="e.g., Demolition of 1 abandoned boundary wall structure."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              )}
            </div>

            {/* Contractor & Agency Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Executing Agency / Dept *</label>
                <input
                  type="text"
                  required
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contractor Name *</label>
                <input
                  type="text"
                  required
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* 3D Render / Blueprint Preview Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                3D Architectural Render / Future Blueprint Visual
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {PRESET_RENDERS.map((render, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFutureVisualizationUrl(render.url)}
                    className={`p-2 rounded-lg border text-[11px] text-left transition-all ${
                      futureVisualizationUrl === render.url
                        ? 'border-purple-500 bg-purple-950/40 text-purple-200'
                        : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {render.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={futureVisualizationUrl}
                onChange={(e) => setFutureVisualizationUrl(e.target.value)}
                placeholder="Or paste custom 3D model render image URL..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting Proposal...' : 'Submit Proposal for MP / MLA Sanction'}</span>
            </button>

          </form>
        </div>

        {/* Right Panel: Interactive GPS Map Picker (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Map Location Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Interactive Geotag Map Picker</h3>
              </div>
              <span className="text-[11px] text-cyan-400 font-mono">Click on map to drop pin</span>
            </div>

            {/* Preset location quick chips */}
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LOCATIONS.map((loc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePresetLocation(loc)}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-slate-300 flex items-center space-x-1 transition-colors"
                >
                  <Navigation className="w-3 h-3 text-cyan-400" />
                  <span>{loc.name}</span>
                </button>
              ))}
            </div>

            {/* Leaflet Map Picker */}
            <div className="h-72 w-full rounded-xl overflow-hidden border border-slate-700 relative shadow-inner">
              <MapContainer
                center={[lat, lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                className="z-10"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPickerMapEvents onLocationSelect={handleLocationSelect} />
                <Marker position={[lat, lng]}>
                  <Popup>
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">Project Site Pin</p>
                      <p className="font-mono text-slate-700">{lat}, {lng}</p>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* GPS Latitude & Longitude Coordinate Inputs */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">GPS Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">GPS Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Constituency</label>
                <input
                  type="text"
                  value={constituency}
                  onChange={(e) => setConstituency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            </div>

          </div>

          {/* 3D Render Live Preview Card */}
          {futureVisualizationUrl && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
              <div className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>3D Future Blueprint Render Preview</span>
              </div>
              <div className="h-36 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative">
                <img
                  src={futureVisualizationUrl}
                  alt="3D Render"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-slate-950/80 px-2.5 py-1 rounded text-[10px] text-white backdrop-blur">
                  Proposed Architectural Vision
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Submitted Proposals Status Tracker */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Agency Proposal Pipeline & Sanction Status</h3>
          </div>
          <button
            onClick={fetchProposals}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {proposals.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No proposals currently in pipeline. Submit your first project above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposals.map((prop) => (
              <div
                key={prop.id}
                className="bg-slate-950 border border-slate-800/80 hover:border-purple-500/40 rounded-xl p-4 space-y-3 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {prop.category}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      prop.status === 'Pending Approval'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse'
                        : prop.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {prop.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-white line-clamp-2">{prop.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{prop.description}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Proposed Budget:</span>
                    <span className="font-bold text-cyan-400">₹{prop.estimated_fund} Lakhs</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Terrain / Scope:</span>
                    <span className="text-slate-200">{prop.terrain_type} • {prop.scope_value} {prop.scope_unit}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Proposing Agency:</span>
                    <span className="text-slate-300 font-medium truncate max-w-[160px]">{prop.agency_name}</span>
                  </div>

                  {prop.is_over_sanction_flag && (
                    <div className="p-2 bg-amber-950/40 border border-amber-500/30 rounded text-[11px] text-amber-300">
                      ⚠️ Over-Sanction Review Triggered (Requires MP Justification)
                    </div>
                  )}

                  {prop.rejection_reason && (
                    <div className="p-2 bg-rose-950/40 border border-rose-500/30 rounded text-[11px] text-rose-300">
                      <strong>Rejection Remark:</strong> {prop.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
