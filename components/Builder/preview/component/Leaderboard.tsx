import React from 'react';
import { useBuilder } from '../../../../context/BuilderContext';

const Leaderboard: React.FC = () => {
  const { state } = useBuilder();

  return (
    <div id="leaderboard-section" className="w-full bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-sm p-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 z-10 relative">
        <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-icons-round text-primary">leaderboard</span> Tabla de Clasificación
        </h2>
        <a href="#" className="text-xs text-primary hover:text-primary/80 flex items-center mt-2 sm:mt-0 transition-colors">
          Ver Tabla Completa <span className="material-icons-round text-sm ml-1">arrow_forward</span>
        </a>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 hide-scroll">
        {state.teams.length > 0 ? (
          state.teams.map((team, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={team.id || index}
                className={`
                  flex-shrink-0 w-64 rounded-xl p-3 flex items-center gap-3 relative overflow-hidden group transition-all cursor-pointer
                  ${isFirst
                    ? 'bg-yellow-400/10 border border-yellow-500/30 hover:bg-yellow-400/20'
                    : 'bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-white/5'
                  }
                  ${index === 1 ? 'bg-gray-100/50 dark:bg-gray-800/40 border-gray-300/30 dark:border-gray-600/30' : ''}
                  ${index === 2 ? 'bg-orange-100/30 dark:bg-orange-900/10 border-orange-300/30 dark:border-orange-800/30' : ''}
                `}
              >
                {isFirst && (
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-yellow-500/20 rounded-full blur-xl group-hover:bg-yellow-500/30 transition-all"></div>
                )}

                <div
                  className={`
                    w-10 h-10 flex items-center justify-center font-display font-bold text-xl rounded-full border-2 
                    ${isFirst
                      ? 'text-yellow-600 dark:text-yellow-500 bg-yellow-100 dark:bg-yellow-900/40 border-yellow-500'
                      : index === 1
                        ? 'text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700/40 border-gray-400'
                        : index === 2
                          ? 'text-orange-600 dark:text-orange-500 bg-orange-100 dark:bg-orange-900/40 border-orange-600'
                          : 'text-gray-400 bg-gray-50 dark:bg-gray-800 border-transparent'
                    }
                  `}
                >
                  {index + 1}
                </div>

                {team.logo_url ? (
                  <img
                    alt={team.name}
                    className="w-10 h-10 rounded-full border-2 border-white dark:border-card-dark shadow-md object-cover"
                    src={team.logo_url}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-white dark:border-card-dark shadow-md bg-gray-600 flex items-center justify-center text-white font-bold">
                    {team.name?.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]" title={team.name}>{team.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    0-0 • 0 Pts
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full text-center text-gray-500 py-4">No hay equipos registrados aún</div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;