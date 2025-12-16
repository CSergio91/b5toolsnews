import React from 'react';
import { MapPin, Users, Info, Calendar } from 'lucide-react';

interface Props {
    config: any;
    teamCount: number;
    matches: any[];
    mode?: 'mobile' | 'desktop';
}

export const TournamentInfoCard: React.FC<Props> = ({ config, teamCount, matches, mode = 'desktop' }) => {
    // Current Phase Logic (Mock or derived)
    const startDate = config?.start_date ? new Date(config.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'TBD';
    const endDate = config?.end_date ? new Date(config.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'TBD';

    // Calculate progress based on matches played vs total
    const totalMatches = matches?.filter(m => m.type === 'match').length || 0;
    const playedMatches = matches?.filter(m => m.type === 'match' && m.status === 'completed').length || 0;
    const progress = totalMatches > 0 ? Math.round((playedMatches / totalMatches) * 100) : 0;

    return (
        <div className="h-full w-full flex flex-col p-4 lg:p-6 text-gray-100 bg-[#121217]/0 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <Info size={18} className="text-orange-500" />
                    <h3 className="font-bold text-lg text-white">Información General</h3>
                </div>
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider border border-green-500/20 animate-pulse">
                    Activo
                </span>
            </div>

            {/* Title / Host */}
            <div className="mb-4 shrink-0">
                <h2 className="text-xl lg:text-2xl font-black text-white leading-tight mb-1 truncate">{config?.name || 'Torneo Sin Nombre'}</h2>
                <p className="text-sm text-white/40 font-medium truncate">Organizado por {config?.organizer_name || 'B5 Sports'}</p>
            </div>

            {/* Grid Stats - No Scroll on Desktop */}
            <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
                {/* Teams */}
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors border border-white/5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Equipos</span>
                    <div className="flex items-end justify-between">
                        <span className="text-3xl font-black text-cyan-400">{teamCount}</span>
                        <Users size={16} className="text-white/20 mb-1" />
                    </div>
                </div>

                {/* Location */}
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors border border-white/5">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sede</span>
                    <div className="flex items-end justify-between">
                        <span className="text-sm font-bold text-orange-400 truncate max-w-[80%]">{config?.location || 'General'}</span>
                        <MapPin size={16} className="text-white/20 mb-1" />
                    </div>
                </div>

                {/* Dates */}
                <div className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors border border-white/5 col-span-2">
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Fechas</span>
                    <div className="flex items-center gap-2 mt-auto">
                        <Calendar size={16} className="text-purple-400" />
                        <span className="text-sm font-bold text-white">{startDate} - {endDate}</span>
                    </div>
                </div>
            </div>

            {/* Progress Footer */}
            <div className="mt-4 pt-4 border-t border-white/5 shrink-0">
                <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase mb-2">
                    <span>Progreso del Torneo</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)] transition-all duration-1000" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
};
