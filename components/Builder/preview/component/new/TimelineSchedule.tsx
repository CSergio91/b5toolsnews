import React, { useState, useMemo, useEffect } from 'react';

interface Props {
    mode?: 'mobile' | 'desktop';
    matchesData: { matches: any[], fields: any[] };
    teams: any[];
}

export const TimelineSchedule: React.FC<Props> = ({ mode = 'desktop', matchesData, teams }) => {

    // 1. Process Schedule (Purely from Props)
    const matches = useMemo(() => {
        const { matches: allMatches, fields } = matchesData;
        const processedMatches: any[] = [];

        // Helper to calculate time
        const addMinutes = (timeStr: string, minutes: number) => {
            const [h, m] = timeStr.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m, 0, 0);
            date.setMinutes(date.getMinutes() + minutes);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        };

        if (fields && fields.length > 0) {
            // A. Logic based on Fields (Calendar Step Data)
            fields.forEach((field: any) => {
                let currentTime = field.startTime || '09:00';

                // We assume field.items is the ordered schedule
                if (field.items && Array.isArray(field.items)) {
                    field.items.forEach((item: any) => {
                        if (item.type === 'match' && item.matchId) {
                            const matchDetails = allMatches.find((m: any) => m.id === item.matchId);
                            if (matchDetails) {
                                // Construct the scheduled match
                                processedMatches.push({
                                    ...matchDetails,
                                    parsedDate: new Date(`${item.date}T${currentTime}`),
                                    field: field.name,
                                    date: item.date,
                                    start_time: currentTime
                                });
                            }
                        }
                        // Increment Time
                        currentTime = addMinutes(currentTime, item.durationMinutes || 60);
                    });
                }
            });
        } else {
            // B. Fallback: Legacy Logic
            allMatches.forEach((m: any) => {
                if (m.date) {
                    const timeStr = m.start_time || '00:00';
                    processedMatches.push({
                        ...m,
                        parsedDate: new Date(`${m.date}T${timeStr}`),
                        field: m.court || m.location || 'Campo Principal'
                    });
                }
            });
        }

        return processedMatches;
    }, [matchesData]);

    // 2. Extract Unique Dates for Tabs
    const uniqueDates = useMemo(() => {
        const dates = new Set(matches.map((m: any) => m.parsedDate.toDateString()));
        return Array.from(dates).sort((a: any, b: any) => new Date(a).getTime() - new Date(b).getTime());
    }, [matches]);

    // State for Selected Date Tab
    const [selectedDateStr, setSelectedDateStr] = useState<string>('');

    // Initialize selected date
    useEffect(() => {
        if (uniqueDates.length > 0) {
            if (!selectedDateStr || !uniqueDates.includes(selectedDateStr)) {
                setSelectedDateStr(uniqueDates[0]);
            }
        }
    }, [uniqueDates, selectedDateStr]);

    // 3. Filter Matches by Selected Date
    const currentMatches = useMemo(() => {
        if (!selectedDateStr) return [];
        return matches.filter(m => m.parsedDate.toDateString() === selectedDateStr);
    }, [matches, selectedDateStr]);

    // 4. Extract Unique Fields for this Day
    const uniqueFields = useMemo(() => {
        if (matchesData.fields && matchesData.fields.length > 0) {
            return matchesData.fields.map(f => f.name);
        }
        return Array.from(new Set(currentMatches.map(m => m.field))).sort();
    }, [currentMatches, matchesData.fields]);

    // Helpers
    const getLogo = (id?: string) => {
        const t = teams.find(x => x.id === id);
        return t?.logo_url || null;
    };
    const getName = (id?: string) => {
        const t = teams.find(x => x.id === id);
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
                    <div className={mode === 'mobile' ? "flex gap-4 h-full snap-x" : "space-y-8"}>
                        {uniqueFields.map(field => (
                            <div
                                key={field}
                                className={mode === 'mobile'
                                    ? "snap-center min-w-[320px] w-[85vw] bg-white/5 rounded-2xl p-4 flex flex-col h-full border border-white/10"
                                    : "relative"
                                }
                            >
                                {/* Swimlane Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                                    <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase text-gray-300 flex items-center gap-2 whitespace-nowrap">
                                        <span className="material-icons-round text-[14px] text-green-400">stadium</span>
                                        {field}
                                    </span>
                                    <div className="h-[1px] flex-1 bg-gradient-to-l from-white/20 to-transparent"></div>
                                </div>

                                {/* Matches Container */}
                                <div className={mode === 'mobile'
                                    ? "flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-20" // Vertical scroll for mobile matches
                                    : "flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x" // Horizontal scroll for desktop matches
                                }>
                                    {currentMatches
                                        .filter(m => m.field === field)
                                        .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())
                                        .map((match, idx) => (
                                            <div
                                                key={idx}
                                                className={`
                                                    snap-start bg-white dark:bg-[#1e1e24] text-gray-900 dark:text-white rounded-2xl p-5 shadow-lg border border-gray-200 dark:border-white/5 hover:-translate-y-1 transition-transform duration-300 group relative overflow-hidden
                                                    ${mode === 'mobile' ? 'w-full min-h-[140px]' : 'min-w-[280px] w-[280px]'}
                                                `}
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
                )
                }
            </div >
        </div >
    );
};
