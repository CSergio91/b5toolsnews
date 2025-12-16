import React from 'react';

interface Props {
    mode?: 'mobile' | 'desktop';
    teams: any[];
}

export const LeaderboardCard: React.FC<Props> = ({ mode = 'desktop', teams }) => {
    // Removed useBuilder

    const sortedTeams = [...teams].slice(0, 5); // Top 5

    return (
        <div className="h-full w-full flex flex-col p-6 bg-white dark:bg-[#1a1a1d] text-gray-900 dark:text-white rounded-3xl relative overflow-hidden shadow-xl border border-gray-200 dark:border-white/5">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-icons-round text-yellow-500 text-sm">leaderboard</span>
                    <h3 className="font-bold text-lg">Tabla de Clasificación</h3>
                </div>
                <button className="flex items-center gap-1 text-[10px] font-bold uppercase text-orange-500 hover:text-orange-400 transition-colors">
                    Ver Completa
                    <span className="material-icons-round text-sm">arrow_forward</span>
                </button>
            </div>

            {/* List View (Clean Rows) */}
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {sortedTeams.length > 0 ? (
                    sortedTeams.map((team, index) => (
                        <div
                            key={index}
                            className="flex items-center p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group"
                        >
                            {/* Rank Circle */}
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mr-4 shrink-0 shadow-sm
                                ${index === 0 ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-400' :
                                    index === 1 ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-400' :
                                        index === 2 ? 'bg-orange-100 text-orange-800 ring-2 ring-orange-400' :
                                            'bg-white dark:bg-white/10 text-gray-500 border border-gray-200 dark:border-white/10'}
                            `}>
                                {index + 1}
                            </div>

                            {/* Team Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-black/20 p-1 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-white/10">
                                    {team.logo_url ? (
                                        <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <span className="font-bold text-[10px] text-gray-500">{team.name?.substring(0, 1)}</span>
                                    )}
                                </div>
                                <div className="flex flex-col truncate">
                                    <span className="font-bold text-sm truncate">{team.name}</span>
                                    <span className="text-[10px] text-gray-400">División 1</span>
                                </div>
                            </div>

                            {/* Stats Columns */}
                            <div className="flex items-center gap-6 ml-4">
                                <div className="text-center hidden sm:block">
                                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Record</span>
                                    <span className="block text-xs font-mono font-bold">5-0</span>
                                </div>
                                <div className="text-center min-w-[50px]">
                                    <span className="block text-[10px] text-gray-400 font-bold uppercase">Pts</span>
                                    <span className="block text-sm font-display font-black text-gray-900 dark:text-white">15</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                        <span className="material-icons-round text-3xl mb-2 opacity-50">block</span>
                        <span className="text-sm">Sin equipos registrados</span>
                    </div>
                )}
            </div>
        </div>
    );
};
