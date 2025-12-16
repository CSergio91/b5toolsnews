import React from 'react';
import { Trophy } from 'lucide-react';

interface Props {
    teams: any[];
    config?: any;
    matches?: any[];
    isFullPage?: boolean;
}

export const LeaderboardWidget: React.FC<Props> = ({ teams, config, matches, isFullPage = false }) => {

    const calculateStats = (teams: any[], matches: any[]) => {
        return teams.map(team => {
            let played = 0;
            let wins = 0;
            let losses = 0;
            let points = 0;

            if (matches) {
                matches.forEach(match => {
                    if (match.status === 'completed') {
                        const isHome = (match.sourceHome || match.home_team_id) === team.id;
                        const isAway = (match.sourceAway || match.away_team_id) === team.id;

                        if (isHome || isAway) {
                            played++;
                            if (match.winner_id === team.id) {
                                wins++;
                                points += (config?.points_for_win || 3);
                            } else if (match.winner_id) { // If there is a winner and it's not me, I lost. Assuming no draws for now unless logic added.
                                losses++;
                                points += (config?.points_for_loss || 0); // usually 0 or 1
                            }
                        }
                    }
                });
            }

            // Fallback for visual demo if no matches played
            if (played === 0) {
                // return { ...team, played, wins, losses, points }; // return real empty stats
            }

            return { ...team, played, wins, losses, points };
        }).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.wins !== a.wins) return b.wins - a.wins;
            return a.name.localeCompare(b.name);
        });
    };

    const sortedTeams = calculateStats(teams, matches || []);

    return (
        <div className="h-full w-full flex flex-col bg-[#121217]/0 text-gray-100 p-4 lg:p-6 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="bg-yellow-500/20 p-1.5 rounded-lg">
                        <Trophy size={16} className="text-yellow-500" />
                    </div>
                    <h3 className="font-bold text-lg text-white">Clasificación</h3>
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 text-[10px] uppercase font-bold text-white/40 border-b border-white/5 pb-2 mb-2 px-2 shrink-0">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-5">Equipo</div>
                <div className="col-span-1 text-center">JJ</div>
                <div className="col-span-1 text-center">JG</div>
                <div className="col-span-1 text-center">JP</div>
                <div className="col-span-3 text-right">PTS</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                {sortedTeams.map((team, index) => (
                    <div key={team.id} className={`grid grid-cols-12 gap-2 items-center px-2 py-3 rounded-xl transition-colors border border-transparent ${index < 3 ? 'bg-gradient-to-r from-white/5 to-transparent' : 'hover:bg-white/5'}`}>
                        {/* Rank */}
                        <div className="col-span-1 flex justify-center">
                            <span className={`
                                font-black text-sm w-6 h-6 flex items-center justify-center rounded-full
                                ${index === 0 ? 'bg-yellow-500 text-black' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-orange-500 text-black' : 'text-white/30'}
                            `}>
                                {index + 1}
                            </span>
                        </div>

                        {/* Team */}
                        <div className="col-span-5 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-black/30 p-0.5 border border-white/10 overflow-hidden shrink-0">
                                {team.logo_url ? (
                                    <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-full" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-white/5 text-[10px] font-bold">
                                        {team.name?.substring(0, 1)}
                                    </div>
                                )}
                            </div>
                            <span className="font-bold text-xs text-white truncate">{team.name}</span>
                        </div>

                        {/* Stats */}
                        <div className="col-span-1 text-center text-xs text-white/60 font-medium">{team.played}</div>
                        <div className="col-span-1 text-center text-xs text-white/60 font-medium">{team.wins}</div>
                        <div className="col-span-1 text-center text-xs text-white/60 font-medium">{team.losses}</div>

                        {/* Points */}
                        <div className="col-span-3 text-right">
                            <span className="font-black text-sm text-yellow-400">{team.points}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
