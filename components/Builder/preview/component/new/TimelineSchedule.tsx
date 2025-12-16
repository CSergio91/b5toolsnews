import React from 'react';
import { Calendar, ChevronRight, MapPin, Clock } from 'lucide-react';

interface Props {
    matches: any[];
    teams: any[];
    isCompact?: boolean;
    mode?: 'mobile' | 'desktop';
}

export const TimelineSchedule: React.FC<Props> = ({ matches, teams, isCompact = false, mode = 'desktop' }) => {

    // Filter logic: Only matches (no 'rest' or 'bye'), ordered by date
    const getUpcomingMatches = () => {
        if (!matches) return [];
        return matches
            .filter(m => m.type === 'match' && (!m.status || m.status === 'scheduled')) // Only plain matches that are scheduled
            .sort((a, b) => {
                // Sort by start_time if available, else date
                const dateA = new Date(a.start_time || a.date);
                const dateB = new Date(b.start_time || b.date);
                return dateA.getTime() - dateB.getTime();
            })
            .slice(0, 10); // Limit to reasonable number
    };

    const upcomingMatches = getUpcomingMatches();

    const formatTime = (isoString?: string) => {
        if (!isoString) return '--:--';
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } catch { return '--:--'; }
    };

    const formatDateShort = (isoString?: string) => {
        if (!isoString) return 'HOY';
        try {
            const date = new Date(isoString);
            const today = new Date();
            if (date.toDateString() === today.toDateString()) return 'HOY';
            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase();
        } catch { return 'TBD'; }
    };

    return (
        <div className="h-full w-full flex flex-col p-4 lg:p-6 text-gray-100 bg-[#121217]/0">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-purple-400" />
                    <h3 className="font-bold text-lg text-white">Próximos Partidos</h3>
                </div>
                {!isCompact && (
                    <button className="flex items-center gap-1 text-[10px] font-bold uppercase text-purple-400 hover:text-purple-300 transition-colors">
                        Ver Calendario <ChevronRight size={14} />
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                {upcomingMatches.length > 0 ? (
                    upcomingMatches.map((match, index) => {
                        // Handle possible ID sources (Builder structure often uses sourceHome/sourceAway or home_team_id/away_team_id)
                        const homeId = (match as any).sourceHome || (match as any).home_team_id;
                        const awayId = (match as any).sourceAway || (match as any).away_team_id;

                        const homeTeam = teams.find(t => t.id === homeId);
                        const awayTeam = teams.find(t => t.id === awayId);

                        // If "rest" is incorrectly typed or we missed it filter, skip if no teams
                        if (!match.sourceHome && !match.home_team_id) return null;

                        return (
                            <div key={index} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                                {/* Date/Time Box */}
                                <div className="flex flex-col items-center justify-center w-12 shrink-0 border-r border-white/10 pr-3">
                                    <span className="text-xs font-bold text-white">{formatTime(match.start_time)}</span>
                                    <span className="text-[9px] text-white/40 uppercase font-bold">{formatDateShort(match.start_time || match.date)}</span>
                                </div>

                                {/* Matchup Column */}
                                <div className="flex-1 flex flex-col gap-1.5">
                                    {/* Home Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold overflow-hidden shrink-0">
                                                {homeTeam?.logo_url ? <img src={homeTeam.logo_url} className="w-full h-full object-cover" /> : homeTeam?.name?.substring(0, 1)}
                                            </div>
                                            <span className="text-xs font-bold text-gray-200 truncate max-w-[140px]">{homeTeam?.name || 'TBD'}</span>
                                        </div>
                                    </div>
                                    {/* Away Row */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold overflow-hidden shrink-0">
                                                {awayTeam?.logo_url ? <img src={awayTeam.logo_url} className="w-full h-full object-cover" /> : awayTeam?.name?.substring(0, 1)}
                                            </div>
                                            <span className="text-xs font-bold text-gray-200 truncate max-w-[140px]">{awayTeam?.name || 'TBD'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Field Info / Status */}
                                <div className="flex flex-col items-end gap-1">
                                    {match.field_id && (
                                        <div className="flex items-center gap-1 text-[10px] text-white/40">
                                            <MapPin size={10} />
                                            <span>Campo 1</span>
                                        </div>
                                    )}
                                    <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        VS
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-white/30">
                        <Calendar size={32} strokeWidth={1} className="mb-2 opacity-50" />
                        <span className="text-xs">No hay partidos programados</span>
                    </div>
                )}
            </div>
        </div>
    );
};
