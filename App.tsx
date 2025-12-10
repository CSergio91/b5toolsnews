import React from 'react';
import { ScoreCard } from './components/ScoreCard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-purple-950 to-slate-950 text-white selection:bg-purple-500 selection:text-white">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-2 py-6 max-w-[1400px]">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="font-bold text-xl">B5</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
              B5Tools <span className="font-light text-white/70">Official Scorekeeper</span>
            </h1>
          </div>
        </header>

        <main className="transition-opacity duration-500 ease-in-out">
          <ScoreCard />
        </main>
        
        <footer className="mt-12 text-center text-white/30 text-xs pb-4">
          <p>Designed with Glass Mode Aesthetics • B5Tools Official Replica • Autosaved Locally</p>
        </footer>
      </div>
    </div>
  );
};

export default App;