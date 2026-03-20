import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import theme from './theme';

// Components
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Parameters from './components/Parameters';
import ResultsEntry from './components/ResultsEntry';
import Statistics from './components/Statistics';
import RegistrationRequest from './components/public/RegistrationRequest';
import RequestsList from './components/admin/RequestsList';
import ParticipationOptions from './components/admin/ParticipationOptions';
import Providers from './components/admin/Providers';
import Users from './components/admin/Users';
import GenericParameter from './components/admin/GenericParameter';
import Reagents from './components/admin/Reagents';
import ControlSamples from './components/admin/ControlSamples';
import ShipmentsAdmin from './components/admin/ShipmentsAdmin';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route path="/register" element={<RegistrationRequest />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="parameters" element={<Parameters />} />
              <Route path="results" element={<Dashboard />} />
              <Route path="results/:shipmentId" element={<ResultsEntry />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="admin/requests" element={<RequestsList />} />
              <Route path="admin/participation-options" element={<ParticipationOptions />} />
              <Route path="admin/providers" element={<Providers />} />
              <Route path="admin/users" element={<Users />} />
              <Route path="admin/instruments" element={<GenericParameter title="Instrumentos" apiEndpoint="instruments" fieldName="name" fieldLabel="Nombre" />} />
              <Route path="admin/brands" element={<GenericParameter title="Marcas" apiEndpoint="brands" fieldName="name" fieldLabel="Nombre" />} />
              <Route path="admin/principles" element={<GenericParameter title="Principios" apiEndpoint="principles" fieldName="name" fieldLabel="Nombre" />} />
              <Route path="admin/calibrations" element={<GenericParameter title="Calibraciones" apiEndpoint="calibrations" fieldName="name" fieldLabel="Nombre" />} />
              <Route path="admin/standards" element={<GenericParameter title="Estándares" apiEndpoint="standards" fieldName="name" fieldLabel="Nombre" />} />
              <Route path="admin/temperatures" element={<GenericParameter title="Temperaturas" apiEndpoint="temperatures" fieldName="value" fieldLabel="Valor" />} />
              <Route path="admin/wavelengths" element={<GenericParameter title="Longitudes de Onda" apiEndpoint="wavelengths" fieldName="value" fieldLabel="Valor" />} />
              <Route path="admin/reagents" element={<Reagents />} />
              <Route path="admin/control-samples" element={<ControlSamples />} />
              <Route path="admin/shipments" element={<ShipmentsAdmin />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
