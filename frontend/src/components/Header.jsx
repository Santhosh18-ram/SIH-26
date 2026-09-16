import React from 'react';
import { ShieldAlert, UserCheck, Users, Eye, Sparkles, Building2, MapPin } from 'lucide-react';

export default function Header({ currentRole, setCurrentRole, activeDistrict, setActiveDistrict, districts }) {
  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-wide">MPLAD <span className="text-cyan-400">AI Monitor</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  SIH2026
                </span>
              </div>
              <p className="text-xs text-slate-400">AI-Assisted Infrastructure Fraud Prevention & Transparency</p>
            </div>
          </div>

          {/* District Location Selector */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">District:</span>
            <select
              value={activeDistrict}
              onChange={(e) => setActiveDistrict(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Districts</option>
              {districts.map(d => (
                <option key={d} value={d} className="bg-slate-900 text-white">{d}</option>
              ))}
            </select>
          </div>

          {/* 3 Role Switcher Pills */}
          <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            
            <button
              onClick={() => setCurrentRole('mla_admin')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'mla_admin'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">MLA / Admin</span>
              <span className="sm:hidden">MLA</span>
            </button>

            <button
              onClick={() => setCurrentRole('agency')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'agency'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agency / Proposer</span>
              <span className="sm:hidden">Agency</span>
            </button>

            <button
              onClick={() => setCurrentRole('field_worker')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'field_worker'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Field Worker</span>
              <span className="sm:hidden">Field</span>
            </button>

            <button
              onClick={() => setCurrentRole('public')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentRole === 'public'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Public Citizen</span>
              <span className="sm:hidden">Public</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
}
