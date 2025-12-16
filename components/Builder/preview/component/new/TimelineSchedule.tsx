import React, { useState, useMemo } from 'react';
import { useBuilder } from '../../../../../context/BuilderContext';
import { RoundMatch } from '../../../../../types/structure';

interface Props {
    mode?: 'mobile' | 'desktop';
}

export const TimelineSchedule: React.FC<Props> = ({ mode = 'desktop' }) => {
    const { state } = useBuilder();

    // 1. Extract Matches and Ensure Valid Dates
    const matches = useMemo(() => {
        return state.matches?.filter((m: any) => m.date).map((m: any) => {
            const dateStr = m.date;
            const timeStr = m.start_time || '00:00';
            const fullDateStr = `${dateStr}T${timeStr}`;

            return {
                ...m,
                parsedDate: new Date(fullDateStr),
                field: m.court || m.location || 'Campo Principal'
            };
        }) || [];
    }, [state.matches]);

    // 2. Extract Unique Dates for Tabs
    const uniqueDates = useMemo(() => {
        const dates = new Set(matches.map((m: any) => m.parsedDate.toDateString()));
        return Array.from(dates).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, [matches]);

    // State for Selected Date Tab
    const [selectedDateStr, setSelectedDateStr] = useState<string>(uniqueDates[0] || new Date().toDateString());

    // 3. Filter Matches by Selected Date
    const currentMatches = useMemo(() => {
        return matches.filter(m => m.parsedDate.toDateString() === selectedDateStr);
    }, [matches, selectedDateStr]);

    // 4. Extract Unique Fields (Swimlanes) for this Day
    const uniqueFields = useMemo(() => {
        return Array.from(new Set(currentMatches.map(m => m.field))).sort();
    }, [currentMatches]);

    // Helpers
    const getLogo = (id?: string) => {
        const t = state.teams.find(x => x.id === id);
        return t?.logo_url || null;
    };
    const getName = (id?: string) => {
        const t = state.teams.find(x => x.id === id);
        return t ? t.name : 'Por definir';
    };

    return (
        <div className="h-full w-full flex flex-col bg-black/20 text-white relative backdrop-blur-sm">
            {/* Header: Title & Date Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center p-6 pb-2 border-b border-white/5 gap-4">
                <h3 className="font-display font-bold text-xl flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                        <span className="material-icons-round text-blue-400">calendar_month</span>
                    </div>
                    Cronograma Oficial
                </h3>

                {/* Date Tabs (Horizontal Scroll) */}
                <div className="flex gap-2 overflow-x-auto max-w-full pb-2 md:pb-0 custom-scrollbar">
                    {uniqueDates.length > 0 ? uniqueDates.map((dateStr) => {
                        const date = new Date(dateStr);
                        const isSelected = dateStr === selectedDateStr;
                        return (
                            <button
                                key={dateStr}
                                onClick={() => setSelectedDateStr(dateStr)}
                                className={`
                                    px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap border
                                    ${isSelected
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]'
                                        : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:border-white/10'}
                                `}
                            >
                                {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </button>
                        );
                    }) : (
                        <div className="px-4 py-2 rounded-xl bg-white/5 text-xs text-gray-500">Sin Fechas</div>
                    )}
                </div>
            </div>

            {/* Swimlanes Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative">
                {currentMatches.length > 0 ? (
                    <div className="space-y-8">
                        {uniqueFields.map(field => (
                            <div key={field} className="relative">
                                {/* Swimlane Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase text-gray-300 flex items-center gap-2">
                                        <span className="material-icons-round text-[14px] text-green-400">stadium</span>
                                        {field}
                                    </span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-l from-white/20 to-transparent"></div>
                                </div>

                                {/* Horizontal Scrollable Matches for this Field */}
                                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                    {currentMatches
                                        .filter(m => m.field === field)
                                        .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
                                        .map((match, idx) => (
                                            <div
                                                key={idx}
                                                className="snap-start min-w-[280px] w-[280px] bg-white dark:bg-[#1e1e24] text-gray-900 dark:text-white rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-white/5 hover:-translate-y-1 transition-transform duration-300 group relative overflow-hidden"
                                            >
                                                {/* Status Indicator Stripe */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>

                                                {/* Time */}
                                                <div className="flex justify-between items-center mb-4 pl-2">
                                                    <span className="text-xl font-display font-bold">
                                                        {match.parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                                        {match.name || 'Partido'}
                                                    </span>
                                                </div>

                                                {/* Teams */}
                                                <div className="space-y-4 pl-2">
                                                    {/* Team 1 */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10">
                                                                {getLogo(match.team1_id) ? (
                                                                    <img src={getLogo(match.team1_id)!} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="text-[10px] font-bold text-gray-400">{getName(match.team1_id).substring(0, 2)}</div>
                                                                )}
                                                            </div>
                                                            <span className="font-bold text-sm truncate max-w-[120px]">{getName(match.team1_id)}</span>
                                                        </div>
                                                        <span className="font-mono text-gray-400">-</span>
                                                    </div>

                                                    {/* Team 2 */}
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10">
                                                                {getLogo(match.team2_id) ? (
                                                                    <img src={getLogo(match.team2_id)!} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="text-[10px] font-bold text-gray-400">{getName(match.team2_id).substring(0, 2)}</div>
                                                                )}
                                                            </div>
                                                            <span className="font-bold text-sm truncate max-w-[120px]">{getName(match.team2_id)}</span>
                                                        </div>
                                                        <span className="font-mono text-gray-400">-</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    {/* Empty Spacer for scroll feel */}
                                    <div className="min-w-[20px]"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <span className="material-icons-round text-6xl mb-4 opacity-20">event_note</span>
                        <p className="text-lg font-medium">No hay partidos para esta fecha.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
