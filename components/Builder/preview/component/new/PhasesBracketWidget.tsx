import React, { useState, useEffect } from 'react';
import { Activity, Trophy, Users, ChevronRight } from 'lucide-react';

interface Props {
    structure?: any;
    mode?: 'mobile' | 'desktop';
}

export const PhasesBracketWidget: React.FC<Props> = ({ structure, mode = 'desktop' }) => {
    const phases = structure?.phases || [];
    const [activePhaseIndex, setActivePhaseIndex] = useState(0);

    // Ensure active index is valid when phases change
    useEffect(() => {
        if (phases.length > 0 && activePhaseIndex >= phases.length) {
            setActivePhaseIndex(0);
        }
    }, [phases]);

    if (!phases || phases.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-[#121217]/60 backdrop-blur-md rounded-3xl border border-white/5 text-white/30">
                <Activity size={48} strokeWidth={1} />
                <span className="text-sm mt-4 font-bold uppercase tracking-widest">Fases no definidas</span>
            </div>
        );
    }

    const activePhase = phases[activePhaseIndex];

    const renderMatches = (phase: any) => {
        if (!phase) return null;

        // Determine matches based on Phase Type
        const matches = phase.matches || []; // For elimination
        const groups = phase.groups || []; // For groups

        if (phase.type === 'elimination') {
            if (matches.length === 0) return <div className="text-white/30 text-xs italic p-4 text-center">Por definir cruces</div>;

            return (
                <div className="space-y-2">
                    {matches.map((match: any, idx: number) => (
                        <div key={idx} className="bg-white/5 p-3 rounded-xl flex items-center justify-between border border-white/5 hover:bg-white/10 transition-colors">
                            <div className="flex flex-col gap-1 w-[45%]">
                                <span className="text-xs font-bold text-white truncate text-right">
                                    {match.sourceHome?.type === 'match.winner' ? `Ganador #${match.sourceHome.id}` : 'TBD'}
                                </span>
                            </div>
                            <div className="flex flex-col items-center px-2">
                                <span className="text-[10px] font-bold text-white/40 uppercase">VS</span>
                            </div>
                            <div className="flex flex-col gap-1 w-[45%]">
                                <span className="text-xs font-bold text-white truncate text-left">
                                    {match.sourceAway?.type === 'match.winner' ? `Ganador #${match.sourceAway.id}` : 'TBD'}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            );
        } else if (phase.type === 'group') {
            if (groups.length === 0) return <div className="text-white/30 text-xs italic p-4 text-center">Grupos no generados</div>;

            return (
                <div className="grid grid-cols-1 gap-2">
                    {groups.map((group: any, idx: number) => (
                        <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5">
                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">{group.name}</h4>
                            <div className="flex flex-wrap gap-2">
                                {group.teams?.map((teamId: string, tIdx: number) => (
                                    <span key={tIdx} className="bg-black/40 text-white/80 text-[10px] px-2 py-1 rounded-md border border-white/5">
                                        Eq {tIdx + 1}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="h-full w-full flex flex-col p-4 bg-[#121217]/0 text-gray-100 rounded-3xl relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0 px-2 pt-2">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-purple-400" />
                    <h3 className="font-bold text-lg text-white">Estructura</h3>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar px-2 shrink-0">
                {phases.map((phase: any, index: number) => {
                    const isActive = index === activePhaseIndex;
                    return (
                        <button
                            key={index}
                            onClick={() => setActivePhaseIndex(index)}
                            className={`
                                whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border
                                ${isActive
                                    ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-900/40'
                                    : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10 hover:text-white'}
                            `}
                        >
                            {phase.name}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-white/5 rounded-2xl border border-white/5 p-4 overflow-y-auto custom-scrollbar mx-2 mb-2 relative">
                {/* Visual Indicator of Phase Type */}
                <div className="absolute top-4 right-4 text-white/10 pointer-events-none">
                    {activePhase?.type === 'elimination' ? <Trophy size={48} /> : <Users size={48} />}
                </div>

                {renderMatches(activePhase)}
            </div>
        </div>
    );
};
