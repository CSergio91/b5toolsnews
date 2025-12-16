import React, { useState } from 'react';
import { useBuilder } from '../../../../context/BuilderContext';

export const LivePlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      id="live-section"
      className="w-full h-full min-h-[400px] bg-black dark:bg-black rounded-2xl shadow-xl border border-gray-800 overflow-hidden relative group transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2805&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="flex flex-col items-center justify-center z-10 p-4 text-center">
          <span className="material-icons-round text-6xl text-gray-500 mb-2">tv_off</span>
          <h3 className="text-xl font-bold text-white">Transmisión No Disponible</h3>
          <p className="text-gray-400 text-sm mt-1">El torneo no ha comenzado o no hay partidos en vivo.</p>
        </div>
      </div>

      {/* Top Overlay Badges */}
      <div className={`absolute top-4 left-4 z-20 flex gap-2 transition-all duration-500 transform translate-y-0 opacity-100`}>
        <span className="px-3 py-1 bg-gray-800 text-gray-400 text-xs font-bold rounded uppercase tracking-wider border border-gray-700 select-none">
          OFFLINE
        </span>
      </div>
    </div>
  );
};

export const ActiveMatchCard: React.FC = () => {
  const { state } = useBuilder();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // For builder preview, we likely don't have active matches with scores.
  // We can show the first match from the fixture if available, or a "No Active Match" state.
  const firstMatch = state.matches && state.matches.length > 0 ? state.matches[0] : null;

  if (!firstMatch) {
    return (
      <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-lg p-5 relative overflow-hidden flex items-center justify-center h-64">
        <div className="text-center">
          <span className="material-icons-round text-4xl text-gray-300 dark:text-gray-600 mb-2">sports_baseball</span>
          <p className="text-gray-500 dark:text-gray-400 font-medium">No hay partidos activos</p>
        </div>
      </div>
    );
  }

  // If we have a match, try to resolve team names. 
  // In builder, match.team1 might be an ID or placeholder string.
  const getTeamName = (idOrName: string | undefined) => {
    if (!idOrName) return 'TBD';
    const team = state.teams.find(t => t.id === idOrName);
    return team ? team.name : idOrName; // Fallback to ID/String if not found
  };

  const getTeamLogo = (idOrName: string | undefined) => {
    if (!idOrName) return '';
    const team = state.teams.find(t => t.id === idOrName);
    return team?.logo_url || '';
  };

  const t1Name = getTeamName(firstMatch.team1_id); // Assuming structure uses team1_id, need to verify Match type
  // Wait, let's check structure type. Usually matches in builder might be in 'structure' or 'matches' array.
  // Context has 'matches: prev.matches || []'.
  // Let's assume standard match structure. 

  const t2Name = getTeamName(firstMatch.team2_id);

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-lg p-5 relative overflow-hidden transition-colors duration-300">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-teal/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-icons-round text-accent-teal">sports_baseball</span> Próximo Partido
        </h2>
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded uppercase">
          Programado
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
        <div className="text-center flex-1 group">
          <img alt={t1Name} className="w-16 h-16 rounded-full mx-auto mb-2 shadow-lg ring-4 ring-gray-100 dark:ring-white/5 object-cover group-hover:scale-105 transition-transform duration-300" src={getTeamLogo(firstMatch.team1_id) || "https://via.placeholder.com/64"} />
          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate max-w-[150px] mx-auto">{t1Name}</h3>
        </div>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-inner border border-gray-700">
            <span className="text-4xl font-display font-bold text-gray-400">-</span>
            <span className="text-gray-500 font-light text-2xl">:</span>
            <span className="text-4xl font-display font-bold text-gray-400">-</span>
          </div>
          <span className="mt-2 text-gray-500 text-xs font-bold">
            VS
          </span>
        </div>

        <div className="text-center flex-1 group">
          <img alt={t2Name} className="w-16 h-16 rounded-full mx-auto mb-2 shadow-lg ring-4 ring-gray-100 dark:ring-white/5 object-cover group-hover:scale-105 transition-transform duration-300" src={getTeamLogo(firstMatch.team2_id) || "https://via.placeholder.com/64"} />
          <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate max-w-[150px] mx-auto">{t2Name}</h3>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex flex-wrap justify-between text-xs text-gray-500 dark:text-gray-400 gap-y-2">
        <div className="flex items-center gap-1">
          <span className="material-icons-round text-sm">schedule</span> {firstMatch.start_time ? new Date(firstMatch.start_time).toLocaleString() : 'TBD'}
        </div>
        <div className="flex items-center gap-1">
          <span className="material-icons-round text-sm">place</span> {firstMatch.location || 'Campo Principal'}
        </div>
      </div>
    </div>
  );
};