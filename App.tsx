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

import { LanguageProvider } from './context/LanguageContext';

const App: React.FC = () => {
  return (
    <LanguageProvider>
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
              <Route path="/dashboard/game" element={<DashboardGamePage />} />
              <Route path="/torneos" element={<TournamentsPage />} />
              <Route path="/torneosinvitados" element={<InvitedTournamentsPage />} />
              {/* Direct Create/Edit Route for Builder */}
              <Route path="/torneos/B5ToolsBuilder/:id" element={<B5ToolsBuilderPage />} />
              {/* Fallback Legacy Route - can be removed eventually or redirected */}
              <Route path="/B5ToolsBuilder" element={<Navigate to="/torneos/B5ToolsBuilder/new" replace />} />
            </Route>

            {/* Redirect generic 404s to Error Page */}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
        </BrowserRouter>
      </LoadingProvider>
    </LanguageProvider>
  );
};

export default App;