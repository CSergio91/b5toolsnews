import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { ScoreKeeperPage } from './pages/ScoreKeeperPage';
import { DashboardPage } from './pages/DashboardPage';
import { DashboardGamePage } from './pages/DashboardGamePage';
import { LoadingProvider } from './context/LoadingContext';
import { GlobalLoader } from './components/GlobalLoader';
import { TournamentsPage } from './pages/TournamentsPage';
import { PrivateRoute } from './components/PrivateRoute';
import { ErrorPage } from './pages/ErrorPage';
import { B5ToolsBuilderPage } from './pages/B5ToolsBuilderPage';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  return (
    <LoadingProvider>
      <GlobalLoader />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/anotaciongratisbeisbol5" element={<ScoreKeeperPage />} />

          {/* Protected Routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/game" element={<DashboardGamePage />} />
            <Route path="/dashboard/game" element={<DashboardGamePage />} />
            <Route path="/torneos" element={<TournamentsPage />} />
            <Route path="/B5ToolsBuilder" element={<B5ToolsBuilderPage />} />
          </Route>

          {/* Redirect generic 404s to Error Page */}
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </BrowserRouter>
    </LoadingProvider>
  );
};

export default App;