import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ScoreKeeperPage } from './pages/ScoreKeeperPage';
import { DashboardPage } from './pages/DashboardPage';
import { DashboardGamePage } from './pages/DashboardGamePage';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/anotaciongratisbeisbol5" element={<ScoreKeeperPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/dashboard/game" element={<DashboardGamePage />} />
        {/* Redirect generic 404s to Landing or just keep them there */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;