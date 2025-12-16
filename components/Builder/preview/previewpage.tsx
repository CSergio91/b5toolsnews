import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BuilderProvider, useBuilder } from '../../../context/BuilderContext';
import Header from './component/Header';
import { LivePlayer, ActiveMatchCard } from './component/LiveSection';
import { GeneralInfoCard, TeamListWidget, QualificationWidget, ScheduleWidget, StatsWidget1, StatsWidget2 } from './component/InfoWidgets';
import Leaderboard from './component/Leaderboard';
import { ParticleBackground } from '../../ParticleBackground';
import { ToastProvider } from '../../../context/ToastContext';

const PreviewContent = () => {
  const { state } = useBuilder();
  const [darkMode, setDarkMode] = useState(true);

  const toggleTheme = () => setDarkMode(!darkMode);

  // Note: Components currently use mock data from constants.ts.
  // In the future, we will map 'state' to these components.

  return (
    <div className={`min-h-screen font-sans text-gray-900 bg-[#0f0f13] ${darkMode ? 'dark' : ''}`}>
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f13]/80 via-[#0f0f13]/90 to-[#0f0f13]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Header darkMode={darkMode} toggleTheme={toggleTheme} />

        <main className="flex-grow w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

          {/* Top Section: Leaderboard Strip */}
          <section className="w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <Leaderboard />
          </section>

          {/* Middle Section: Live Stream & General Info */}
          <section className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Live Player - Takes up 3/4 width on large screens */}
            <div className="lg:col-span-3 h-full">
              <LivePlayer />
            </div>

            {/* General Info Card - Sidebar */}
            <div className="lg:col-span-1 h-full">
              <GeneralInfoCard />
            </div>
          </section>

          {/* Bottom Section: Dashboard Widgets */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {/* Column 1: Active Match */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <h3 className="text-white font-display font-bold text-lg flex items-center gap-2">
                  <span className="w-2 h-6 bg-accent-teal rounded-full"></span>
                  Group Stage
                </h3>
                <ActiveMatchCard />
              </div>
            </div>

            {/* Column 2: Teams List */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <h3 className="text-white font-display font-bold text-lg flex items-center gap-2">
                  <span className="w-2 h-6 bg-gray-500 rounded-full"></span>
                  Teams
                </h3>
                <TeamListWidget />
              </div>
            </div>

            {/* Column 3: Qualification & Schedule */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <h3 className="text-white font-display font-bold text-lg flex items-center gap-2">
                  <span className="w-2 h-6 bg-accent-orange rounded-full"></span>
                  Qualification
                </h3>
                <QualificationWidget />
              </div>
            </div>

            {/* Column 4: Schedule & Stats */}
            <div className="lg:col-span-1 space-y-6">
              <div className="space-y-6">
                <h3 className="text-white font-display font-bold text-lg flex items-center gap-2">
                  <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                  Schedule
                </h3>
                <ScheduleWidget />
                <div className="grid grid-cols-2 gap-4">
                  <StatsWidget1 />
                  <StatsWidget2 />
                </div>
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};

export const TournamentPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [initialState, setInitialState] = useState<any>(null);

  React.useEffect(() => {
    // Try to load state from local storage for preview
    const savedState = localStorage.getItem('b5_builder_state');
    if (savedState) {
      try {
        setInitialState(JSON.parse(savedState));
      } catch (e) {
        console.error("Failed to parse local builder state for preview", e);
      }
    }
  }, []);

  if (!initialState) {
    return (
      <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center text-white">
        <div className="animate-pulse">Cargando vista previa...</div>
      </div>
    );
  }

  return (
    <BuilderProvider initialId={id} initialState={initialState}>
      <ToastProvider>
        <PreviewContent />
      </ToastProvider>
    </BuilderProvider>
  );
};

export default TournamentPreviewPage;