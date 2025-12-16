import React from 'react';

interface Props {
    mode?: 'mobile' | 'desktop';
    config: any; // Tournament Config
    teamCount: number;
    matches: any[];
}

export const TournamentInfoCard: React.FC<Props> = ({ mode = 'desktop', config, teamCount, matches }) => {
    // Removed useBuilder hook - now pure data


    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Por definir';
        return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    // Calculate Progress (mock logic based on dates or matches)
    const calculateProgress = () => {
        if (!matches || matches.length === 0) return 0;
        const played = matches.filter((m: any) => m.home_score !== undefined && m.away_score !== undefined).length; // simplistic check
        return Math.min(100, Math.round((played / matches.length) * 100));
    };
    const progress = calculateProgress();

    return (
        <div className="h-full w-full flex flex-col p-6 bg-white dark:bg-[#1a1a1d] text-gray-900 dark:text-white rounded-3xl relative shadow-xl border border-gray-200 dark:border-white/5 overflow-hidden">
            {/* Content Container */}
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="material-icons-round text-orange-500 text-sm">info</span>
                            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Información General</h2>
                        </div>
                        <h1 className="text-2xl font-display font-bold leading-tight">
                            {config.name || 'Torneo Sin Nombre'}
                        </h1>
                        <p className="text-xs text-gray-500 mt-1">Organizado por {config.organizer_name || 'B5Tools'}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase border border-green-500/20">
                        Activo
                    </span>
                </div>

                {/* Stats Grid 2x2 */}
                <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                    {/* Stat 1: Teams */}
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl flex flex-col justify-center transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Equipos</span>
                        <span className="text-3xl font-display font-bold text-blue-500">{teamCount}</span>
                    </div>
                    {/* Stat 2: Sedes (Mocked or calculated) */}
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl flex flex-col justify-center transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Sedes</span>
                        <span className="text-3xl font-display font-bold text-orange-500">1</span>
                    </div>
                    {/* Stat 3: Phase */}
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl flex flex-col justify-center transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Fase Actual</span>
                        <span className="text-lg font-display font-bold text-gray-700 dark:text-gray-200 truncate">Fase de Grupos</span>
                    </div>
                    {/* Stat 4: Type/Status */}
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl flex flex-col justify-center transition-colors hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tipo</span>
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-yellow-500 text-sm">emoji_events</span>
                            <span className="text-lg font-display font-bold text-gray-700 dark:text-gray-200">{config.tournament_type || 'Abierto'}</span>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-auto">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Progreso del Torneo</span>
                        <span className="text-xs font-bold">{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
