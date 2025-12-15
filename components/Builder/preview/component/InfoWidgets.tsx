import React from 'react';
import { QUALIFICATIONS, SCHEDULE_ITEMS, TEAM_LIST_ITEMS } from '../constants';

export const GeneralInfoCard: React.FC = () => {
  return (
    <div id="stats-section" className="scroll-mt-24 col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 row-span-2 bg-white dark:bg-card-dark dark:border-gray-700/50 border border-gray-200 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110">
        <span className="material-icons-round text-8xl text-primary">emoji_events</span>
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
            <h3 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors">Summer Slugfest '23</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Hosted by B5 Sports Association</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-background-dark/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-white/5 transition-colors">
              <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Teams</span>
              <span className="text-2xl font-bold text-accent-teal">24</span>
            </div>
            <div className="bg-gray-50 dark:bg-background-dark/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-white/5 transition-colors">
              <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Venues</span>
              <span className="text-2xl font-bold text-accent-orange">3</span>
            </div>
            <div className="bg-gray-50 dark:bg-background-dark/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-white/5 transition-colors">
              <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Current Phase</span>
              <span className="text-lg font-bold text-primary">Group Stage</span>
            </div>
            <div className="bg-gray-50 dark:bg-background-dark/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-white/5 transition-colors">
              <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Weather</span>
              <div className="flex items-center gap-2">
                <span className="material-icons-round text-yellow-500 text-sm animate-pulse-slow">wb_sunny</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">78°F</span>
              </div>
            </div>
          </div>
          <div className="mt-auto">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1 overflow-hidden">
              <div className="bg-gradient-to-r from-accent-teal to-accent-orange h-2.5 rounded-full relative overflow-hidden" style={{ width: '45%' }}>
                 <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>Tournament Progress</span>
              <span>45%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TeamListWidget: React.FC = () => {
  return (
    <div className="col-span-1 md:col-span-1 lg:col-span-1 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-lg p-5 flex flex-col h-64 md:h-auto overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-icons-round text-gray-400">groups</span> Teams
        </h2>
        <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">24 Total</span>
      </div>
      <div className="overflow-y-auto pr-2 custom-scrollbar space-y-3 flex-1">
        {TEAM_LIST_ITEMS.map((team, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer group transition-all hover:pl-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">{team.name}</span>
            <span className={`h-2 w-2 rounded-full ring-2 ring-transparent group-hover:ring-offset-1 group-hover:ring-current transition-all ${
              team.status === 'active' ? 'bg-green-500' : 
              team.status === 'inactive' ? 'bg-gray-500' : 'bg-red-500'
            }`}></span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const QualificationWidget: React.FC = () => {
  return (
    <div className="col-span-1 md:col-span-2 lg:col-span-2 bg-gradient-to-br from-primary/10 via-white to-white dark:from-primary/20 dark:via-card-dark dark:to-card-dark border border-gray-200 dark:border-primary/30 rounded-2xl shadow-lg p-5 relative overflow-hidden group">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="material-icons-round text-primary">emoji_events</span> Qualification
        </h2>
        <button className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-2 py-1 bg-white dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary focus:outline-none transition-colors active:scale-95">
          Next Up <span className="material-icons-round text-sm ml-1">filter_list</span>
        </button>
      </div>
      <div className="space-y-3 relative z-10">
        {QUALIFICATIONS.map((match) => (
          <div key={match.id} className="bg-white/60 dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5 flex items-center justify-between hover:scale-[1.01] hover:bg-white dark:hover:bg-white/10 hover:border-primary/20 transition-all cursor-pointer backdrop-blur-sm shadow-sm hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">{match.round}</span>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-gray-900 dark:text-white group-hover/item:text-primary">{match.team1Name} vs {match.team2Name}</span>
                <span className="text-xs text-gray-500">Semi-Final {match.id}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="block text-xs font-bold text-primary">{match.time}</span>
              <span className="block text-[10px] text-gray-400">{match.details}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Decorative background element */}
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
    </div>
  );
};

export const ScheduleWidget: React.FC = () => {
  return (
    <div id="schedule-section" className="scroll-mt-24 col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-1 row-span-1 bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-700/50 rounded-2xl shadow-lg p-5">
      <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <span className="material-icons-round text-blue-400">calendar_today</span> Schedule
      </h2>
      <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-2 space-y-6 pl-4">
        {SCHEDULE_ITEMS.map((item, idx) => (
          <div key={item.id} className="relative group cursor-pointer">
            <div className={`
              absolute -left-[21px] top-1 h-3 w-3 rounded-full ring-4 ring-white dark:ring-card-dark transition-all duration-300
              ${item.status === 'active' ? 'bg-green-500 scale-125' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-blue-400'}
            `}></div>
            <p className={`text-xs font-bold mb-1 transition-colors ${item.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 group-hover:text-blue-400'}`}>
              {item.time}
            </p>
            <p className="text-sm text-gray-900 dark:text-white font-medium group-hover:translate-x-1 transition-transform">{item.title}</p>
            <p className="text-xs text-gray-500">{item.subtitle}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatsWidget1: React.FC = () => (
  <div className="col-span-1 bg-accent-teal/10 dark:bg-accent-teal/5 border border-accent-teal/20 rounded-2xl p-5 flex flex-col justify-center items-center text-center hover:bg-accent-teal/20 dark:hover:bg-accent-teal/10 transition-colors duration-300 group cursor-default">
    <span className="material-icons-round text-accent-teal text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">trending_up</span>
    <span className="text-3xl font-display font-bold text-gray-900 dark:text-white group-hover:text-accent-teal transition-colors">142</span>
    <span className="text-xs text-gray-500 uppercase tracking-wide">Runs Scored Today</span>
  </div>
);

export const StatsWidget2: React.FC = () => (
  <div className="col-span-1 bg-accent-orange/10 dark:bg-accent-orange/5 border border-accent-orange/20 rounded-2xl p-5 flex flex-col justify-center items-center text-center hover:bg-accent-orange/20 dark:hover:bg-accent-orange/10 transition-colors duration-300 group cursor-default">
    <span className="material-icons-round text-accent-orange text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">people</span>
    <span className="text-3xl font-display font-bold text-gray-900 dark:text-white group-hover:text-accent-orange transition-colors">850+</span>
    <span className="text-xs text-gray-500 uppercase tracking-wide">Live Viewers</span>
  </div>
);