import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Chip, Container } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import axiosClient from '../api/axiosClient';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await axiosClient.post('/auth/logout', null, { params: { refreshToken } });
    } catch (e) {
      console.error(e);
    } finally {
      dispatch(logout());
      navigate('/login');
    }
  };

  return (
    <AppBar position="sticky" sx={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1.5} onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
            <LocalHospitalIcon sx={{ color: '#0284c7', fontSize: 32 }} />
            <Typography variant="h6" fontWeight="700" sx={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              MEDICORE
            </Typography>
          </Box>

          {isAuthenticated && user && (
            <Box display="flex" alignItems="center" gap={1}>
              {(user.role === 'ROLE_PATIENT' || user.role === 'ROLE_ADMIN') && (
                <Button
                  color="inherit"
                  onClick={() => navigate('/patient')}
                  sx={{ borderRadius: 2, color: location.pathname === '/patient' ? '#38bdf8' : 'inherit' }}
                >
                  Patient Portal
                </Button>
              )}
              {(user.role === 'ROLE_DOCTOR' || user.role === 'ROLE_ADMIN') && (
                <Button
                  color="inherit"
                  onClick={() => navigate('/doctor')}
                  sx={{ borderRadius: 2, color: location.pathname === '/doctor' ? '#38bdf8' : 'inherit' }}
                >
                  Doctor Portal
                </Button>
              )}
              {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_STAFF') && (
                <Button
                  color="inherit"
                  onClick={() => navigate('/admin')}
                  sx={{ borderRadius: 2, color: location.pathname === '/admin' ? '#38bdf8' : 'inherit' }}
                >
                  Admin & Inventory
                </Button>
              )}
              <Button
                color="inherit"
                onClick={() => navigate('/queue')}
                sx={{ borderRadius: 2, color: location.pathname === '/queue' ? '#38bdf8' : 'inherit' }}
              >
                Live Queue Tracker
              </Button>
            </Box>
          )}

          <Box display="flex" alignItems="center" gap={2}>
            {isAuthenticated && user ? (
              <>
                <Chip
                  icon={<AccountCircleIcon />}
                  label={`${user.fullName} (${user.role.replace('ROLE_', '')})`}
                  variant="outlined"
                  sx={{ color: '#f8fafc', borderColor: '#334155' }}
                />
                <Button variant="outlined" color="error" size="small" startIcon={<LogoutIcon />} onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="contained" sx={{ background: 'linear-gradient(90deg, #0284c7, #0d9488)' }} onClick={() => navigate('/login')}>
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
