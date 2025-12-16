import React from 'react';

interface Props {
    teams: any[];
    config?: any;
    matches?: any[];
    isFullPage?: boolean;
}

export const LeaderboardWidget: React.FC<Props> = ({ teams, config, matches, isFullPage = false }) => {

    const sortedTeams = [...teams].sort((a, b) => {
        // Mock points logic: In real app, calculate from matches
        // For visual, just use index or mock property
        return 0;
    }).slice(0, isFullPage ? undefined : 6); // Top 6 for dashboard row

    if (isFullPage) {
        // Vertical List for Full Page / Mobile
        return (
            <div className="h-full w-full flex flex-col p-4">
                {/* Standard Vertical List Mock - Implement if needed */}
                <div className="text-white">Full Leaderboard</div>
            </div>
        );
    }

    // Horizontal Dashboard Widget
    return (
        <div className="h-full w-full flex flex-row items-center gap-4 py-2 px-4 overflow-x-auto no-scrollbar mask-gradient-x">
            <div className="flex items-center gap-2 pr-4 border-r border-white/10 shrink-0">
                <div className="bg-yellow-500/20 p-2 rounded-lg">
                    <span className="material-icons-round text-yellow-500 text-xl">leaderboard</span>
                </div>
                <div>
                    <span className="block text-[10px] text-white/40 uppercase font-bold tracking-wider">Lideran</span>
                    <span className="block text-sm font-bold text-white">Clasificación</span>
                </div>
            </div>

            {sortedTeams.map((team, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 px-3 py-2 rounded-xl transition-all group shrink-0 min-w-[180px]"
                >
                    {/* Rank */}
                    <span className={`
                        font-black text-lg w-6 text-center
                        ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-orange-400' : 'text-white/20'}
                    `}>
                        {index + 1}
                    </span>

                    {/* Team */}
                    <div className="w-8 h-8 rounded-full bg-black/30 p-0.5 border border-white/10 overflow-hidden shrink-0">
                        {team.logo_url ? (
                            <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 text-[10px] font-bold">
                                {team.name?.substring(0, 1)}
                            </div>
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        <span className="font-bold text-xs text-white truncate max-w-[100px]">{team.name}</span>
                        <div className="flex items-center gap-2 text-[10px]">
                            <span className="text-white/40">5-0</span>
                            <span className="text-green-400 font-bold">15 Pts</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
