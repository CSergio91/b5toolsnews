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
import { InvitedTournamentsPage } from './pages/InvitedTournamentsPage';
import { supabase } from './lib/supabase';
import TournamentPreviewPage from './components/Builder/preview/previewpage';
import { TournamentPreviewNewPage } from './components/Builder/preview/TournamentPreviewNewPage';
import { TournamentStartDashboard } from './pages/TournamentStartDashboard';

import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <LoadingProvider>
        <ToastProvider>
          <GlobalLoader />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/anotaciongratisbeisbol5" element={<ScoreKeeperPage />} />

              {/* Protected Routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/game" element={<DashboardGamePage />} />
                <Route path="/dashboard/torneos" element={<TournamentsPage />} />
                <Route path="/dashboard/torneos/:id/Start" element={<TournamentStartDashboard />} />
                <Route path="/dashboard/torneosinvitados" element={<InvitedTournamentsPage />} />
                {/* Direct Create/Edit Route for Builder */}
                <Route path="/dashboard/torneos/B5ToolsBuilder/:id" element={<B5ToolsBuilderPage />} />
                <Route path="/dashboard/torneos/B5ToolsBuilder/:id/preview" element={<TournamentPreviewPage />} />
                <Route path="/dashboard/torneos/B5ToolsBuilder/:id/previewnew" element={<TournamentPreviewNewPage />} />
                {/* Fallback Legacy Route - can be removed eventually or redirected */}
                <Route path="/torneos" element={<Navigate to="/dashboard/torneos" replace />} />
                <Route path="/torneosinvitados" element={<Navigate to="/dashboard/torneosinvitados" replace />} />
                <Route path="/B5ToolsBuilder" element={<Navigate to="/dashboard/torneos/B5ToolsBuilder/new" replace />} />
              </Route>

              {/* Redirect generic 404s to Error Page */}
              <Route path="*" element={<ErrorPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </LoadingProvider>
    </LanguageProvider>
  );
};

export default App;