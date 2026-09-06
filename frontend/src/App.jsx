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
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/patient" element={isAuthenticated ? <PatientDashboard /> : <Navigate to="/login" />} />
          <Route path="/doctor" element={isAuthenticated ? <DoctorDashboard /> : <Navigate to="/login" />} />
          <Route path="/admin" element={isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/queue" element={<LiveTokenWidget />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/patient" : "/login"} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
