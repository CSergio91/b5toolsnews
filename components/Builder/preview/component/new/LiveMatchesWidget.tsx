import React from 'react';
import { PlayCircle, Cast, Users, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    matches: any[];
    teams: any[];
    mode?: 'mobile' | 'desktop';
}

export const LiveMatchesWidget: React.FC<Props> = ({ matches, teams, mode = 'desktop' }) => {
    // Determine the "Main" live match (Hero match)
    // Logic: Look for 'in_progress', fallback to 'scheduled' nearest to now, fallback to last 'finished'
    const liveMatch = matches.find(m => m.status === 'in_progress') || matches[0];

    // Placeholder if no matches
    if (!liveMatch) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-white/30 p-8 space-y-4">
                <Trophy size={64} strokeWidth={1} />
                <p className="text-sm font-medium uppercase tracking-widest text-center">No hay partidos programados</p>
            </div>
        );
    }

    const homeTeamId = (liveMatch as any).sourceHome || (liveMatch as any).home_team_id;
    const awayTeamId = (liveMatch as any).sourceAway || (liveMatch as any).away_team_id;

    const homeTeam = teams.find(t => t.id === homeTeamId);
    const awayTeam = teams.find(t => t.id === awayTeamId);

    return (
        <div className="w-full h-full min-h-[400px] relative flex flex-col justify-end p-8 overflow-hidden group">
            {/* Background Image (Stadium/Action) */}
            <div className="absolute inset-0 bg-[#0f0f13] z-0">
                {/* Mock Stadium Image or Gradient */}
                <img
                    src="https://images.unsplash.com/photo-1577416412292-7613e5129671?q=80&w=2072&auto=format&fit=crop"
                    className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000"
                    alt="Stadium"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f13] via-[#0f0f13]/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f13]/80 via-transparent to-[#0f0f13]/80" />
            </div>

            {/* Live Indicator & Viewers */}
            <div className="absolute top-6 left-6 z-10 flex gap-4">
                <div className="flex items-center gap-1.5 bg-red-600 px-3 py-1 rounded text-xs font-bold text-white shadow-lg shadow-red-900/40 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white block" />
                    EN VIVO
                </div>
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs font-bold text-white border border-white/10">
                    <Users size={12} />
                    1.2k
                </div>
            </div>

            {/* Main Content: Match Up */}
            <div className="relative z-10 flex flex-col lg:flex-row items-end lg:items-center justify-between gap-8 w-full mt-auto">

                {/* Teams & Score */}
                <div className="flex-1 w-full lg:w-auto">
                    <div className="flex flex-col gap-2 mb-2">
                        <span className="text-purple-400 font-bold tracking-wider text-xs uppercase">{liveMatch.name || 'Partido Destacado'}</span>
                        <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight">
                            {homeTeam?.name || 'Equipo 1'} <span className="text-white/30 mx-2">vs</span> {awayTeam?.name || 'Equipo 2'}
                        </h2>
                    </div>

                    {/* Scoreboard Pill */}
                    <div className="mt-4 bg-black/40 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-6 max-w-fit">
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-black text-white">{(liveMatch as any).home_score || 0}</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex flex-col items-center">
                            <div className="text-xs font-bold bg-white/10 px-2 py-0.5 rounded text-white/60 mb-1">SET 1</div>
                            <span className="text-xs text-red-400 font-mono animate-pulse">● Inning 4</span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-black text-white">{(liveMatch as any).away_score || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button className="hidden lg:flex items-center justify-center w-16 h-16 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)] group-hover:bg-purple-500 group-hover:text-white">
                    <PlayCircle size={32} fill="currentColor" className="ml-1" />
                </button>
            </div>

            {/* Bottom Link */}
            <div className="absolute bottom-6 right-6 z-20 flex gap-2">
                <button className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors">
                    MAS STREAMS <Cast size={12} />
                </button>
            </div>
        </div>
    );
};
