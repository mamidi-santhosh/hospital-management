import React, { useState } from 'react';
import { Container, Paper, Box, Typography, TextField, Button, Tabs, Tab, MenuItem, Alert } from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/authSlice';
import axiosClient from '../api/axiosClient';

export default function LoginPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [username, setUsername] = useState('john_doe');
  const [password, setPassword] = useState('password123');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('ROLE_PATIENT');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const response = await axiosClient.post('/auth/login', { username, password });
      const data = response.data.data;
      dispatch(
        setCredentials({
          user: { id: data.userId, username: data.username, email: data.email, fullName: data.fullName, role: data.role },
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        })
      );
      if (data.role === 'ROLE_DOCTOR') navigate('/doctor');
      else if (data.role === 'ROLE_ADMIN') navigate('/admin');
      else navigate('/patient');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || 'Login failed. Check credentials.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await axiosClient.post('/auth/register', { username, email, password, fullName, phoneNumber, role });
      setSuccessMsg('Registration successful! Please login with your credentials.');
      setTabIndex(0);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8, mb: 8 }}>
      <Paper className="glass-card" elevation={0} sx={{ p: 4, borderRadius: 4 }}>
        <Box textAlign="center" mb={3}>
          <LocalHospitalIcon sx={{ fontSize: 48, color: '#0284c7', mb: 1 }} />
          <Typography variant="h5" fontWeight="700">
            Healthcare System Portal
          </Typography>
          <Typography variant="body2" color="#94a3b8">
            OAuth2 Secure Authentication Gateway
          </Typography>
        </Box>

        <Tabs value={tabIndex} onChange={(e, val) => setTabIndex(val)} centered sx={{ mb: 3 }}>
          <Tab label="Sign In" sx={{ color: '#94a3b8' }} />
          <Tab label="Register" sx={{ color: '#94a3b8' }} />
        </Tabs>

        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 2 }}>{successMsg}</Alert>}

        {tabIndex === 0 ? (
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{ input: { color: '#fff' } }}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ input: { color: '#fff' } }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 1, py: 1.5, borderRadius: 2, background: 'linear-gradient(90deg, #0284c7, #0d9488)' }}
            >
              Sign In
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleRegister}>
            <TextField fullWidth label="Full Name" margin="dense" value={fullName} onChange={(e) => setFullName(e.target.value)} sx={{ input: { color: '#fff' } }} />
            <TextField fullWidth label="Username" margin="dense" value={username} onChange={(e) => setUsername(e.target.value)} sx={{ input: { color: '#fff' } }} />
            <TextField fullWidth label="Email" type="email" margin="dense" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ input: { color: '#fff' } }} />
            <TextField fullWidth label="Password" type="password" margin="dense" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ input: { color: '#fff' } }} />
            <TextField fullWidth label="Phone Number" margin="dense" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} sx={{ input: { color: '#fff' } }} />
            <TextField
              select
              fullWidth
              label="User Role"
              margin="dense"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              sx={{ select: { color: '#fff' } }}
            >
              <MenuItem value="ROLE_PATIENT">Patient</MenuItem>
              <MenuItem value="ROLE_DOCTOR">Doctor</MenuItem>
              <MenuItem value="ROLE_ADMIN">Administrator</MenuItem>
              <MenuItem value="ROLE_STAFF">Staff</MenuItem>
            </TextField>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, py: 1.5, borderRadius: 2, background: 'linear-gradient(90deg, #0284c7, #0d9488)' }}
            >
              Register Account
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
