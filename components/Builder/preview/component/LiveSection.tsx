import React, { useState } from 'react';
import { ACTIVE_MATCH } from '../constants';

export const LivePlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      id="live-section"
      className="scroll-mt-24 col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-3 row-span-2 bg-black dark:bg-black rounded-2xl shadow-xl border border-gray-800 overflow-hidden relative group transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Area */}
      <div className="absolute inset-0 bg-gray-900 flex items-center justify-center overflow-hidden">
        {isPlaying ? (
          <div className="w-full h-full relative">
            <iframe 
              className="w-full h-full object-cover"
              src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&controls=0&loop=1" 
              title="Live Stream" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
            {/* Simulated UI controls when playing */}
            <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                <button 
                  onClick={() => setIsPlaying(false)}
                  className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
                >
                  <span className="material-icons-round text-white text-4xl">pause</span>
                </button>
            </div>
             {/* Live Indicator in corner when playing */}
             <div className="absolute top-4 right-4 animate-pulse pointer-events-none">
                <div className="h-3 w-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
             </div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2805&auto=format&fit=crop')] bg-cover bg-center opacity-60 group-hover:opacity-70 transition-all duration-500 transform group-hover:scale-105"></div>
            
            {/* Play Button */}
            <button 
              onClick={() => setIsPlaying(true)}
              className="w-16 h-16 rounded-full bg-primary/90 text-black flex items-center justify-center shadow-lg shadow-primary/20 backdrop-blur-sm z-10 cursor-pointer hover:scale-110 hover:bg-primary transition-all duration-300 group-active:scale-95"
            >
              <span className="material-icons-round text-4xl ml-1">play_arrow</span>
            </button>
          </>
        )}
      </div>

      {/* Top Overlay Badges */}
      <div className={`absolute top-4 left-4 z-20 flex gap-2 transition-all duration-500 transform ${isPlaying && !isHovered ? '-translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
        <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded uppercase tracking-wider animate-pulse border border-red-500/50 shadow-lg shadow-red-900/20 select-none">
          LIVE
        </span>
        <span className="px-2 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded flex items-center gap-1 border border-white/10 select-none">
          <span className="material-icons-round text-[10px]">visibility</span> 1.2k
        </span>
      </div>

      {/* Bottom Overlay Info */}
      <div className={`absolute bottom-0 w-full p-6 bg-gradient-to-t from-black via-black/80 to-transparent z-20 transition-all duration-500 transform ${isPlaying && !isHovered ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <h2 className="font-display text-2xl font-bold text-white mb-1 drop-shadow-md">Sección de Transmisiones en Vivo</h2>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <img className="w-8 h-8 rounded-full border-2 border-white bg-gray-800 object-cover" src={ACTIVE_MATCH.team1.logo} alt={ACTIVE_MATCH.team1.name} />
              <img className="w-8 h-8 rounded-full border-2 border-white bg-gray-800 object-cover" src={ACTIVE_MATCH.team2.logo} alt={ACTIVE_MATCH.team2.name} />
            </div>
            <span className="text-gray-200 text-sm font-medium">{ACTIVE_MATCH.team1.name} vs {ACTIVE_MATCH.team2.name}</span>
          </div>
          <button className="text-xs text-primary hover:text-white transition-colors uppercase font-bold tracking-wide flex items-center gap-1 self-start sm:self-auto">
            More Streams <span className="material-icons-round text-sm">open_in_new</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const ActiveMatchCard: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-lg p-5 relative overflow-hidden transition-colors duration-300">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent-teal/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-icons-round text-accent-teal">sports_baseball</span> Group Stage
        </h2>
        <div className="relative inline-block text-left">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex items-center justify-center w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-3 py-1 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none transition-colors" 
            type="button"
          >
            Match #{ACTIVE_MATCH.id}
            <span className={`material-icons-round text-sm ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </button>
          
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 animate-fade-in-down">
              <div className="py-1" role="menu" aria-orientation="vertical">
                <a href="#" className="block px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Match #A11 (Finished)</a>
                <a href="#" className="block px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Match #A13 (Upcoming)</a>
                <a href="#" className="block px-4 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700">View All Matches</a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
        <div className="text-center flex-1 group">
          <img alt={ACTIVE_MATCH.team1.name} className="w-16 h-16 rounded-full mx-auto mb-2 shadow-lg ring-4 ring-gray-100 dark:ring-white/5 object-cover group-hover:scale-105 transition-transform duration-300" src={ACTIVE_MATCH.team1.logo} />
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{ACTIVE_MATCH.team1.name}</h3>
          <p className="text-xs text-gray-500">Coach: J. Smith</p>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-4 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-inner border border-gray-700 transform hover:scale-105 transition-transform duration-300">
            <span className="text-4xl font-display font-bold text-accent-teal">{ACTIVE_MATCH.score1}</span>
            <span className="text-gray-500 font-light text-2xl">:</span>
            <span className="text-4xl font-display font-bold text-accent-orange">{ACTIVE_MATCH.score2}</span>
          </div>
          <span className="mt-2 px-3 py-0.5 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20 animate-pulse">
            LIVE • Inning {ACTIVE_MATCH.inning}
          </span>
        </div>
        
        <div className="text-center flex-1 group">
          <img alt={ACTIVE_MATCH.team2.name} className="w-16 h-16 rounded-full mx-auto mb-2 shadow-lg ring-4 ring-gray-100 dark:ring-white/5 object-cover group-hover:scale-105 transition-transform duration-300" src={ACTIVE_MATCH.team2.logo} />
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{ACTIVE_MATCH.team2.name}</h3>
          <p className="text-xs text-gray-500">Coach: M. Doe</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700/50 flex flex-wrap justify-between text-xs text-gray-500 dark:text-gray-400 gap-y-2">
        <div className="flex items-center gap-1">
          <span className="material-icons-round text-sm">schedule</span> {ACTIVE_MATCH.time}
        </div>
        <div className="flex items-center gap-1">
          <span className="material-icons-round text-sm">place</span> {ACTIVE_MATCH.field}
        </div>
        <div className="flex items-center gap-1">
          <span className="material-icons-round text-sm">badge</span> Ref: {ACTIVE_MATCH.referee}
        </div>
      </div>
    </div>
  );
};