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
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ParticleBackground />
        <div className="absolute inset-0 bg-[#0f0f13]/90"></div>
      </div>

      <div className="relative z-10">
        <Header darkMode={darkMode} toggleTheme={toggleTheme} />

        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* Hero Grid Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <LivePlayer />
            <ActiveMatchCard />
            <GeneralInfoCard />
            <TeamListWidget />
            <ScheduleWidget />
            <StatsWidget1 />
            <StatsWidget2 />
          </div>

          {/* Full Width Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Leaderboard />
          </div>
        </main>
      </div>
    </div>
  );
};

export const TournamentPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <BuilderProvider initialId={id}>
      <ToastProvider>
        <PreviewContent />
      </ToastProvider>
    </BuilderProvider>
  );
};

export default TournamentPreviewPage;