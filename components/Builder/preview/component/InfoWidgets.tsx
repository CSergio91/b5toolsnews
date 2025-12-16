import React from 'react';
import { useBuilder } from '../../../../context/BuilderContext';
import { QUALIFICATIONS, SCHEDULE_ITEMS, TEAM_LIST_ITEMS } from '../constants';

export const GeneralInfoCard: React.FC = () => {
  const { state } = useBuilder();

  return (
    <div className="w-full h-full bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-sm p-4 relative overflow-hidden transition-colors duration-300">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-teal/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-end items-start mb-4 relative z-10">
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold rounded uppercase">
          Programado
        </span>
      </div>
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="material-icons-round text-accent-orange">info</span> General Info
          </h2>
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded uppercase">Active</span>
        </div>
        <div className="flex-grow space-y-6">
          <div>
            <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">
              {state.config.name || 'Torneo Nuevo'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Organizado por {state.config.organizer_name || 'B5Tools User'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-background-dark/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-white/5 transition-colors">
              <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Equipos</span>
              <span className="text-2xl font-bold text-accent-teal">{state.teams.length}</span>
            </div>
            <div className="bg-gray-50 dark:bg-background-dark/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-white/5 transition-colors">
              <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Ubicación</span>
              <span className="text-sm font-bold text-accent-orange truncate" title={state.config.location}>{state.config.location || 'N/A'}</span>
            </div>
            <div className="bg-gray-50 dark:bg-background-dark/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-white/5 transition-colors">
              <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Tipo</span>
              <span className="text-lg font-bold text-primary capitalize">{state.config.tournament_type || 'Open'}</span>
            </div>
            <div className="bg-gray-50 dark:bg-background-dark/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-white/5 transition-colors">
              <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Clima</span>
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-yellow-500 text-sm animate-pulse-slow">wb_sunny</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">--</span>
              </div>
            </div>
          </div>
          <div className="mt-auto">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1 overflow-hidden">
              <div className="bg-gradient-to-r from-accent-teal to-accent-orange h-2.5 rounded-full relative overflow-hidden" style={{ width: '10%' }}>
                <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>Progreso del Torneo</span>
              <span>10%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TeamListWidget: React.FC = () => {
  const { state } = useBuilder();

  return (
    <div className="h-full bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-lg p-5 flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-icons-round text-gray-400">groups</span> Equipos
        </h2>
        <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">{state.teams.length} Total</span>
      </div>
      <div className="overflow-y-auto pr-2 custom-scrollbar space-y-3 flex-1">
        {state.teams.length > 0 ? (
          state.teams.map((team, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer group transition-all hover:pl-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">{team.name}</span>
              <span className={`h-2 w-2 rounded-full ring-2 ring-transparent group-hover:ring-offset-1 group-hover:ring-current transition-all bg-green-500`}></span>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 text-sm py-4">No hay equipos registrados</div>
        )}
      </div>
    </div>
  );
};

export const QualificationWidget: React.FC = () => {
  return (
    <div className="h-full bg-gradient-to-br from-primary/10 via-white to-white dark:from-primary/20 dark:via-card-dark dark:to-card-dark border border-gray-200 dark:border-primary/30 rounded-2xl shadow-lg p-5 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-icons-round text-primary">emoji_events</span> Qualification
        </h2>
        <button className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-2 py-1 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary focus:outline-none transition-colors active:scale-95">
          Next Up <span className="material-icons-round text-sm ml-1">filter_list</span>
        </button>
      </div>
      <div className="space-y-3 relative z-10">
        <div className="text-center text-sm text-gray-500 py-6 italic">
          El cuadro de clasificación se generará cuando comience el torneo.
        </div>
      </div>
      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
    </div>
  );
};

export const ScheduleWidget: React.FC = () => {
  const { state } = useBuilder();
  // Get upcoming 5 matches
  const upcomingMatches = state.matches
    ? state.matches
      .sort((a, b) => new Date(a.start_time || 0).getTime() - new Date(b.start_time || 0).getTime())
      .slice(0, 5)
    : [];

  const getTeamName = (id: string | undefined) => {
    if (!id) return 'TBD';
    const t = state.teams.find(team => team.id === id);
    return t ? t.name : id;
  };

  return (
    <div id="schedule-section" className="bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-lg p-5">
      <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="material-icons-round text-blue-400">calendar_today</span> Calendario
      </h2>
      <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-2 space-y-6 pl-4">
        {upcomingMatches.length > 0 ? (
          upcomingMatches.map((match, idx) => (
            <div key={match.id || idx} className="relative group cursor-pointer">
              <div className={`
                absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-card-dark transition-all duration-300
                bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400
              `}></div>
              <p className={`text-xs font-bold mb-1 transition-colors text-gray-500 group-hover:text-blue-400`}>
                {match.start_time ? new Date(match.start_time).toLocaleString() : 'Fecha Pendiente'}
              </p>
              <p className="text-sm text-gray-900 dark:text-white font-medium group-hover:translate-x-1 transition-transform">
                {getTeamName(match.team1_id)} vs {getTeamName(match.team2_id)}
              </p>
              <p className="text-xs text-gray-500">{match.location || 'Campo por asignar'}</p>
            </div>
          ))
        ) : (
          <div className="text-sm text-gray-500 italic py-2">No hay partidos programados.</div>
        )}
      </div>
    </div>
  );
};

export const StatsWidget1: React.FC = () => {
  const { state } = useBuilder();
  return (
    <div className="bg-accent-teal/10 dark:bg-accent-teal/5 border border-accent-teal/20 rounded-2xl p-5 flex flex-col justify-center items-center text-center hover:bg-accent-teal/20 dark:hover:bg-accent-teal/10 transition-colors duration-300 group cursor-default">
      <span className="material-icons-round text-accent-teal text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">calendar_today</span>
      <span className="text-3xl font-display font-bold text-gray-900 dark:text-white group-hover:text-accent-teal transition-colors">{state.matches?.length || 0}</span>
      <span className="text-xs text-gray-500 uppercase tracking-wide">Partidos</span>
    </div>
  );
};

export const StatsWidget2: React.FC = () => {
  const { state } = useBuilder();
  return (
    <div className="bg-accent-orange/10 dark:bg-accent-orange/5 border border-accent-orange/20 rounded-2xl p-5 flex flex-col justify-center items-center text-center hover:bg-accent-orange/20 dark:hover:bg-accent-orange/10 transition-colors duration-300 group cursor-default">
      <span className="material-icons-round text-accent-orange text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">sports</span>
      <span className="text-3xl font-display font-bold text-gray-900 dark:text-white group-hover:text-accent-orange transition-colors">{state.referees?.length || 0}</span>
      <span className="text-xs text-gray-500 uppercase tracking-wide">Árbitros</span>
    </div>
  );
};