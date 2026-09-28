import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';

import PublicLayout from './layouts/PublicLayout';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MapViewer from './pages/MapViewer';
import LandRecords from './pages/LandRecords';
import Workflows from './pages/Workflows';
import RRTracker from './pages/RRTracker';
import FieldAgent from './pages/FieldAgent';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="login" element={<Login />} />
              <Route path="transparency" element={<MapViewer />} />
            </Route>
            
            {/* Private App Routes */}
            <Route path="/app" element={<MainLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="map" element={<MapViewer />} />
              <Route path="records" element={<LandRecords />} />
              <Route path="workflows" element={<Workflows />} />
              <Route path="rr-tracker" element={<RRTracker />} />
              <Route path="field-agent" element={<FieldAgent />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
