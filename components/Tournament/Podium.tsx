
import React from 'react';
import { Trophy } from 'lucide-react';

interface PodiumProps {
    teams: {
        place: 1 | 2 | 3;
        name: string;
        logo?: string;
        color?: string;
    }[];
}

export const Podium: React.FC<PodiumProps> = ({ teams }) => {
    const getTeam = (place: number) => teams.find(t => t.place === place);

    const first = getTeam(1);
    const second = getTeam(2);
    const third = getTeam(3);

    const renderStep = (team: typeof first, place: number, heightClass: string, colorClass: string, trophyColor: string) => {
        if (!team) return (
            <div className={`flex flex-col items-center justify-end w-32 ${heightClass}`}>
                <div className={`w-full bg-white/5 border border-white/10 rounded-t-lg mx-1 relative opacity-30 h-full`}></div>
            </div>
        );

        return (
            <div className={`flex flex-col items-center justify-end w-32 group ${heightClass} transition-all duration-700 animate-in slide-in-from-bottom-10 fade-in`}>
                {/* Team Info */}
                <div className="mb-4 flex flex-col items-center gap-2 transform transition-transform group-hover:-translate-y-2">
                    <Trophy size={place === 1 ? 48 : 32} className={`${trophyColor} drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]`} />
                    <div className="font-bold text-white text-center text-sm uppercase tracking-wider">{team.name}</div>
                    {team.logo && <img src={team.logo} alt={team.name} className="w-12 h-12 object-contain" />}
                </div>

                {/* Step */}
                <div className={`w-full ${colorClass} rounded-t-lg mx-1 relative flex items-start justify-center pt-2 h-full shadow-2xl border-t border-white/20`}>
                    <span className="text-4xl font-black text-white/20 mix-blend-overlay">{place}</span>

                    {/* Lighting Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                </div>
            </div>
        );
    };

    return (
        <div className="flex items-end justify-center gap-2 h-80 pt-10">
            {/* 2nd Place (Left) */}
            {renderStep(second, 2, 'h-48', 'bg-slate-400', 'text-slate-300')}

            {/* 1st Place (Center) */}
            {renderStep(first, 1, 'h-64', 'bg-yellow-500', 'text-yellow-400')}

            {/* 3rd Place (Right) */}
            {renderStep(third, 3, 'h-32', 'bg-amber-700', 'text-amber-600')}
        </div>
    );
};
