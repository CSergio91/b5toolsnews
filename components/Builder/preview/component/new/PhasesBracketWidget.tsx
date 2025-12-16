import React from 'react';
import { Activity } from 'lucide-react';

interface Props {
    structure?: any;
    mode?: 'mobile' | 'desktop';
}

export const PhasesBracketWidget: React.FC<Props> = ({ structure, mode = 'desktop' }) => {
    // This widget is primarily for the mobile "Phases" tab or a future full bracket view.
    // For the dashboard preview, we can show a summary or a placeholder if no structure exists.

    if (!structure || !structure.phases || structure.phases.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-[#121217]/60 backdrop-blur-md rounded-3xl border border-white/5 text-white/30">
                <Activity size={48} strokeWidth={1} />
                <span className="text-sm mt-4 font-bold uppercase tracking-widest">Fases no definidas</span>
            </div>
        );
    }

    // Simple list view of phases for now
    return (
        <div className="h-full w-full flex flex-col p-6 bg-[#121217] text-gray-100 rounded-3xl relative overflow-hidden border border-white/5">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Activity size={18} className="text-purple-400" />
                    <h3 className="font-bold text-lg text-white">Estructura del Torneo</h3>
                </div>
            </div>

            <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
                {structure.phases.map((phase: any, idx: number) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-white text-lg">{phase.name}</span>
                            <span className="text-[10px] font-bold uppercase text-white/40 bg-white/5 px-2 py-1 rounded">
                                {phase.type === 'elimination' ? 'Eliminación' : 'Grupos'}
                            </span>
                        </div>
                        <div className="text-xs text-white/50">
                            {phase.settings?.matchesPerRound || 'Automático'} partidos
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
