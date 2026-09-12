import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import LiveTokenWidget from './components/LiveTokenWidget';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { useSelector } from 'react-redux';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
    primary: {
      main: '#0284c7',
    },
    secondary: {
      main: '#0d9488',
    },
  },
  typography: {
    fontFamily: ['Inter', 'sans-serif'].join(','),
  },
});

export default function App() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const getDefaultRoute = () => {
    if (!isAuthenticated || !user) return '/login';
    if (user.role === 'ROLE_DOCTOR') return '/doctor';
    if (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_STAFF') return '/admin';
    return '/patient';
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/patient"
            element={
              isAuthenticated && (user?.role === 'ROLE_PATIENT' || user?.role === 'ROLE_ADMIN') ? (
                <PatientDashboard />
              ) : (
                <Navigate to={getDefaultRoute()} />
              )
            }
          />
          <Route
            path="/doctor"
            element={
              isAuthenticated && (user?.role === 'ROLE_DOCTOR' || user?.role === 'ROLE_ADMIN') ? (
                <DoctorDashboard />
              ) : (
                <Navigate to={getDefaultRoute()} />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAuthenticated && (user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_STAFF') ? (
                <AdminDashboard />
              ) : (
                <Navigate to={getDefaultRoute()} />
              )
            }
          />
          <Route path="/queue" element={<LiveTokenWidget />} />
          <Route path="*" element={<Navigate to={getDefaultRoute()} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
