import React from 'react';
import { MapPin, Users, CloudSun, Info } from 'lucide-react';

interface Props {
    config: any;
    teamCount: number;
    matches: any[];
    mode?: 'mobile' | 'desktop';
}

export const TournamentInfoCard: React.FC<Props> = ({ config, teamCount, matches, mode = 'desktop' }) => {
    // Current Phase Logic (Mock or derived)
    const currentPhase = "Fase de Grupos";
    const progress = 45; // Mock percentage

    return (
        <div className="h-full w-full flex flex-col p-6 text-gray-100">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                    <Info size={18} className="text-orange-500" />
                    <h3 className="font-bold text-lg text-white">Información General</h3>
                </div>
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20 animate-pulse">
                    Activo
                </span>
            </div>

            {/* Title / Host */}
            <div className="mb-8">
                <h2 className="text-2xl font-black text-white leading-tight mb-1">{config?.tournament_name || 'Torneo Sin Nombre'}</h2>
                <p className="text-sm text-white/40 font-medium">Organizado por {config?.organizer || 'B5 Sports'}</p>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Teams */}
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors border border-white/5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Equipos</span>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-black text-cyan-400">{teamCount}</span>
                        <Users size={16} className="text-white/20 mb-1" />
                    </div>
                </div>

                {/* Venues (Mock) */}
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors border border-white/5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sedes</span>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-black text-orange-400">3</span>
                        <MapPin size={16} className="text-white/20 mb-1" />
                    </div>
                </div>

                {/* Phase */}
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors border border-white/5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fase Actual</span>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-yellow-400">{currentPhase}</span>
                        <div className="w-full bg-white/10 h-1 rounded-full mt-2 overflow-hidden">
                            <div className="bg-yellow-500 h-full rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>

                {/* Weather (Mock) */}
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors border border-white/5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Clima</span>
                    <div className="flex items-center gap-2">
                        <CloudSun size={24} className="text-white" />
                        <span className="text-lg font-bold text-white">24°C</span>
                    </div>
                </div>
            </div>

            {/* Progress Footer */}
            <div className="mt-6 pt-4 border-t border-white/5">
                <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase mb-2">
                    <span>Progreso del Torneo</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};
