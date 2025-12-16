import React, { useState } from 'react';
import { useBuilder } from '../../../../../context/BuilderContext';

interface Props {
    mode?: 'mobile' | 'desktop';
}

export const LiveMatchesWidget: React.FC<Props> = ({ mode = 'desktop' }) => {
    const { state } = useBuilder();
    // In builder preview, we likely don't have "Live" matches, just scheduled ones.
    // We will simulate the look of the "Live" section where user requested Dropdown per set.

    // Simulating a "Live" match for preview design purposes if list is empty
    const displayMatches = state.matches?.slice(0, 3) || [];

    // State for expanded accordion items (by match index)
    const [expandedMatch, setExpandedMatch] = useState<number | null>(0);

    return (
        <div className="h-full w-full flex flex-col relative overflow-hidden group bg-black rounded-3xl shadow-2xl border border-gray-800">
            {/* Background Image Effect */}
            <div className="absolute inset-0 z-0">
                {/* Placeholder Stadium Background - In real app, could be dynamic */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1508098682722-e99c159899f8?q=80&w=2596&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-1000"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            </div>

            {/* Header: Live Badge & Viewers */}
            <div className="relative z-10 flex justify-between items-start p-6">
                <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    <span className="px-2 py-1 bg-red-600 rounded text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-red-900/50">
                        VIVO
                    </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-gray-300">
                    <span className="material-icons-round text-sm">visibility</span>
                    1.2k
                </div>
            </div>

            {/* Main Content: Center Stage Scoreboard */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
                {displayMatches.length > 0 ? (
                    <div className="w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            {/* Team 1 */}
                            <div className="flex flex-col items-center gap-2 w-1/3">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 p-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                    {state.teams.find(t => t.id === displayMatches[0].team1_id)?.logo_url ? (
                                        <img src={state.teams.find(t => t.id === displayMatches[0].team1_id)?.logo_url} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-xl">{getName(state.teams, displayMatches[0].team1_id).substring(0, 2)}</div>
                                    )}
                                </div>
                                <h3 className="font-bold text-sm md:text-base text-center leading-tight truncate w-full">{getName(state.teams, displayMatches[0].team1_id)}</h3>
                            </div>

                            {/* Score */}
                            <div className="flex flex-col items-center">
                                <span className="text-4xl md:text-6xl font-display font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-2xl">
                                    5 : 2
                                </span>
                                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-yellow-500 border border-yellow-500/20 mt-2 backdrop-blur-sm">
                                    Entrada 3
                                </span>
                            </div>

                            {/* Team 2 */}
                            <div className="flex flex-col items-center gap-2 w-1/3">
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 p-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                    {state.teams.find(t => t.id === displayMatches[0].team2_id)?.logo_url ? (
                                        <img src={state.teams.find(t => t.id === displayMatches[0].team2_id)?.logo_url} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center font-bold text-xl">{getName(state.teams, displayMatches[0].team2_id).substring(0, 2)}</div>
                                    )}
                                </div>
                                <h3 className="font-bold text-sm md:text-base text-center leading-tight truncate w-full">{getName(state.teams, displayMatches[0].team2_id)}</h3>
                            </div>
                        </div>

                        {/* Match Feed / Play-by-Play Simplified */}
                        <div className="w-full bg-black/40 backdrop-blur-md rounded-xl p-3 border border-white/5">
                            <p className="text-xs text-gray-300 text-center flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                Bases llenas, 2 outs. Turno para el bateador estrella.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500">
                        <span className="material-icons-round text-5xl mb-2 opacity-50">tv_off</span>
                        <p>No hay transmisión activa</p>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="relative z-10 p-4 border-t border-white/10 flex justify-between items-center bg-black/20 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="material-icons-round text-sm">mic</span>
                    </span>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Comentaristas</span>
                        <span className="text-xs font-bold">Oficial B5</span>
                    </div>
                </div>
                <button className="text-xs bg-white text-black font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors shadow-lg shadow-white/10">
                    Ver Partido
                </button>
            </div>
        </div>
    );
};

const getName = (teams: any[], id?: string) => {
    const t = teams.find(x => x.id === id);
    return t ? t.name : (id || 'Por definir');
};
