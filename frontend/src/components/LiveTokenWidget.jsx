import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, Chip, Button, Select, MenuItem, FormControl, InputLabel, Container } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import SensorsIcon from '@mui/icons-material/Sensors';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosClient from '../api/axiosClient';

export default function LiveTokenWidget() {
  const [doctorId, setDoctorId] = useState(1);
  const [doctors, setDoctors] = useState([
    { id: 1, fullName: 'Dr. Sarah Jenkins', specialization: 'Cardiology' },
    { id: 2, fullName: 'Dr. Robert Chen', specialization: 'Neurology' },
    { id: 3, fullName: 'Dr. Emily Vance', specialization: 'Pediatrics' },
  ]);
  const [queueState, setQueueState] = useState({
    currentServingToken: 4,
    nextUpcomingToken: 5,
    totalInQueue: 12,
    doctorName: 'Dr. Sarah Jenkins',
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect STOMP WebSocket client
    const socket = new SockJS('http://localhost:8083/ws-token');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = () => {
      setConnected(true);
      stompClient.subscribe(`/topic/queue/${doctorId}`, (message) => {
        if (message.body) {
          const payload = JSON.parse(message.body);
          setQueueState(payload);
        }
      });
    };

    stompClient.onDisconnect = () => {
      setConnected(false);
    };

    stompClient.activate();

    return () => {
      stompClient.deactivate();
    };
  }, [doctorId]);

  const simulateTokenNext = async () => {
    try {
      const nextToken = queueState.currentServingToken + 1;
      setQueueState((prev) => ({
        ...prev,
        currentServingToken: nextToken,
        nextUpcomingToken: nextToken + 1,
      }));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
      <Paper
        className="glass-card"
        elevation={0}
        sx={{
          p: 4,
          borderRadius: 4,
          border: '1px solid rgba(56, 189, 248, 0.2)',
          background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <SensorsIcon sx={{ color: '#10b981', fontSize: 32 }} />
            <Typography variant="h5" fontWeight="700">
              Real-Time Queue Token Stream
            </Typography>
          </Box>
          <Chip
            icon={<span className="live-pulse" />}
            label={connected ? 'Live WebSocket Active' : 'Connecting to STOMP Broker...'}
            sx={{
              backgroundColor: connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: connected ? '#34d399' : '#fbbf24',
              borderColor: connected ? '#10b981' : '#f59e0b',
            }}
          />
        </Box>

        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel sx={{ color: '#94a3b8' }}>Select Doctor Roster</InputLabel>
          <Select
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
          >
            {doctors.map((doc) => (
              <MenuItem key={doc.id} value={doc.id}>
                {doc.fullName} ({doc.specialization})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Grid container spacing={3} textAlign="center">
          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #0284c7', borderRadius: 3 }}>
              <ConfirmationNumberIcon sx={{ fontSize: 40, color: '#38bdf8' }} />
              <Typography variant="overline" display="block" color="#94a3b8">
                CURRENT SERVING TOKEN
              </Typography>

              <Typography variant="h2" fontWeight="800" color="#38bdf8">
                #{queueState.currentServingToken}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, background: 'rgba(13, 148, 136, 0.1)', border: '1px solid #0d9488', borderRadius: 3 }}>
              <ConfirmationNumberIcon sx={{ fontSize: 40, color: '#2dd4bf' }} />
              <Typography variant="overline" display="block" color="#94a3b8">
                NEXT UPCOMING TOKEN
              </Typography>
              <Typography variant="h2" fontWeight="800" color="#2dd4bf">
                #{queueState.nextUpcomingToken}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper sx={{ p: 3, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: 3 }}>
              <AccessTimeIcon sx={{ fontSize: 40, color: '#fbbf24' }} />
              <Typography variant="overline" display="block" color="#94a3b8">
                TOTAL PATIENTS IN QUEUE
              </Typography>
              <Typography variant="h2" fontWeight="800" color="#fbbf24">
                {queueState.totalInQueue}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box mt={4} display="flex" justifyContent="center">
          <Button variant="contained" color="secondary" size="large" onClick={simulateTokenNext} sx={{ borderRadius: 3, px: 4 }}>
            Advance Consultation Queue Token
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
