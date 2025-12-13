
import React, { useState, useEffect } from 'react';
import { useBuilder } from '../../context/BuilderContext';
import { TournamentPhase, RoundMatch } from '../../types/structure';
import { Calendar as CalendarIcon, Clock, MapPin, Coffee, ArrowRight, Save, LayoutList } from 'lucide-react';

export const CalendarStep: React.FC = () => {
    const { state, updateStructure } = useBuilder();
    const [matches, setMatches] = useState<RoundMatch[]>([]);

    // Load matches from structure
    useEffect(() => {
        if (state.structure) {
            const allMatches: RoundMatch[] = [];
            state.structure.phases.forEach(p => {
                if (p.type === 'group' && p.groups) {
                    p.groups.forEach(g => {
                        g.matches.forEach(m => allMatches.push({ ...m, phaseId: p.name }));
                    });
                } else if (p.matches) {
                    allMatches.push(...p.matches);
                }
            });
            // Sort by Global ID if possible, otherwise by Phase order
            allMatches.sort((a, b) => (a.globalId || 0) - (b.globalId || 0));
            setMatches(allMatches);
        }
    }, [state.structure]);

    const handleUpdateMatch = (matchId: string, updates: Partial<RoundMatch>) => {
        if (!state.structure) return;

        const newPhases = state.structure.phases.map(p => {
            // Update in Groups
            if (p.type === 'group' && p.groups) {
                return {
                    ...p,
                    groups: p.groups.map(g => ({
                        ...g,
                        matches: g.matches.map(m => m.id === matchId ? { ...m, ...updates } : m)
                    }))
                };
            }
            // Update in Elimination/Placement
            if (p.matches) {
                return {
                    ...p,
                    matches: p.matches.map(m => m.id === matchId ? { ...m, ...updates } : m)
                };
            }
            return p;
        });

        updateStructure({
            ...state.structure,
            phases: newPhases
        });
    };

    // Group matches by Date for display
    const groupedMatches = matches.reduce((acc, match) => {
        const date = match.date || 'Sin Programar';
        if (!acc[date]) acc[date] = [];
        acc[date].push(match);
        return acc;
    }, {} as Record<string, RoundMatch[]>);

    // Helpers for mass updates?
    // "Auto-schedule"? Maybe later.

    return (
        <div className="h-full flex flex-col gap-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarIcon className="text-blue-500" /> Calendario y Horarios
                </h2>
                <div className="flex gap-2 text-sm text-white/50">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Programado</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-white/20"></div> Pendiente</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                {Object.entries(groupedMatches).sort((a, b) => a[0] === 'Sin Programar' ? -1 : a[0].localeCompare(b[0])).map(([date, dateMatches]) => (
                    <div key={date} className="bg-[#1a1a20] rounded-xl border border-white/5 overflow-hidden">
                        {/* Date Header */}
                        <div className={`p-4 font-bold flex justify-between items-center ${date === 'Sin Programar' ? 'bg-orange-500/10 text-orange-200' : 'bg-blue-600/20 text-blue-100'}`}>
                            <div className="flex items-center gap-2">
                                <CalendarIcon size={16} />
                                {date === 'Sin Programar' ? 'Partidos Sin Fecha' : new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </div>
                            <span className="text-xs opacity-50 bg-black/20 px-2 py-1 rounded">{dateMatches.length} Partidos</span>
                        </div>

                        {/* Matches List */}
                        <div className="divide-y divide-white/5">
                            {dateMatches.map(match => (
                                <div key={match.id} className="p-4 hover:bg-white/5 transition-colors flex flex-col md:flex-row gap-4 items-center">
                                    {/* Match Info */}
                                    <div className="w-full md:w-48 flex-shrink-0">
                                        <div className="text-xs text-blue-400 font-bold mb-1">#{match.globalId} • {match.phaseId}</div>
                                        <div className="font-medium text-white">{match.name}</div>
                                    </div>

                                    {/* Scheduling Inputs */}
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                        {/* Date */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] uppercase font-bold text-white/30 flex items-center gap-1">
                                                <CalendarIcon size={10} /> Fecha
                                            </label>
                                            <input
                                                type="date"
                                                className="bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                                                value={match.date || ''}
                                                onChange={(e) => handleUpdateMatch(match.id, { date: e.target.value })}
                                            />
                                        </div>

                                        {/* Time */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] uppercase font-bold text-white/30 flex items-center gap-1">
                                                <Clock size={10} /> Hora
                                            </label>
                                            <input
                                                type="time"
                                                className="bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 outline-none transition-colors"
                                                value={match.startTime || ''}
                                                onChange={(e) => handleUpdateMatch(match.id, { startTime: e.target.value })}
                                            />
                                        </div>

                                        {/* Location */}
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] uppercase font-bold text-white/30 flex items-center gap-1">
                                                <MapPin size={10} /> Cancha / Lugar
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Ej. Cancha 1"
                                                className="bg-black/20 border border-white/10 rounded px-2 py-1.5 text-sm text-white focus:border-blue-500 outline-none transition-colors placeholder:text-white/10"
                                                value={match.location || ''}
                                                onChange={(e) => handleUpdateMatch(match.id, { location: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Status or Break */}
                                    {/* Could add "Add Break" feature here later */}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend / Tips */}
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
                <LayoutList className="text-blue-400 mt-1 flex-shrink-0" size={18} />
                <div className="text-sm text-blue-200/80">
                    <strong className="text-blue-200 block mb-1">Planificación del Torneo</strong>
                    Define las fechas y horarios para cada partido. Los partidos se agruparán automáticamente por fecha. Los cambios se guardan en tiempo real.
                </div>
            </div>
        </div>
    );
};
