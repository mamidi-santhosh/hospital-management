import React, { useEffect, useState } from 'react';
import { Box, Paper, Typography, Grid, Chip, Button, Select, MenuItem, FormControl, InputLabel, Container } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import SensorsIcon from '@mui/icons-material/Sensors';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosClient from '../api/axiosClient';

export default function LiveTokenWidget({ doctorId: propDoctorId, showDoctorSelector = true }) {
  const [selectedDoctorId, setSelectedDoctorId] = useState(propDoctorId || 1);
  const [doctors, setDoctors] = useState([]);
  const [queueState, setQueueState] = useState({
    currentServingToken: 0,
    nextUpcomingToken: 0,
    totalInQueue: 0,
    doctorName: '',
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (propDoctorId) {
      setSelectedDoctorId(propDoctorId);
    }
  }, [propDoctorId]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchQueueMetrics(selectedDoctorId);
    }
  }, [selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      const res = await axiosClient.get('/doctors');
      const docList = res.data.data || [];
      setDoctors(docList);
      if (docList.length > 0 && !propDoctorId) {
        setSelectedDoctorId(docList[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQueueMetrics = async (docId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axiosClient.get(`/appointments/doctor/${docId}?date=${today}`);
      const appts = res.data.data || [];
      
      const activeAppts = appts.filter((a) => a.status !== 'CANCELLED' && a.status !== 'COMPLETED');
      const currentServing = appts.find((a) => a.status === 'IN_PROGRESS') || activeAppts[0];
      
      const currentServingToken = currentServing ? currentServing.tokenNumber : (appts.length > 0 ? appts[0].tokenNumber : 0);
      const nextUpcomingToken = currentServing ? currentServingToken + 1 : 0;
      const totalInQueue = activeAppts.length;
      const docObj = doctors.find((d) => d.id === docId);

      setQueueState({
        currentServingToken,
        nextUpcomingToken,
        totalInQueue,
        doctorName: docObj ? docObj.fullName : `Doctor #${docId}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!selectedDoctorId) return;

    // Connect STOMP WebSocket client
    const socket = new SockJS('http://localhost:8083/ws-token');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: () => {},
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = () => {
      setConnected(true);
      stompClient.subscribe(`/topic/queue/${selectedDoctorId}`, (message) => {
        if (message.body) {
          const payload = JSON.parse(message.body);
          setQueueState((prev) => ({
            ...prev,
            currentServingToken: payload.currentServingToken || prev.currentServingToken,
            nextUpcomingToken: payload.nextUpcomingToken || prev.nextUpcomingToken,
            totalInQueue: payload.totalInQueue !== undefined ? payload.totalInQueue : prev.totalInQueue,
            doctorName: payload.doctorName || prev.doctorName,
          }));
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
  }, [selectedDoctorId]);

  const simulateTokenNext = () => {
    const nextToken = queueState.currentServingToken + 1;
    setQueueState((prev) => ({
      ...prev,
      currentServingToken: nextToken,
      nextUpcomingToken: nextToken + 1,
      totalInQueue: Math.max(0, prev.totalInQueue - 1),
    }));
  };

  return (
    <Paper
      className="glass-card"
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: '1px solid rgba(56, 189, 248, 0.2)',
        background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))',
        mb: 4,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <SensorsIcon sx={{ color: '#10b981', fontSize: 32 }} />
          <Typography variant="h6" fontWeight="700">
            Real-Time Queue Tracker {queueState.doctorName ? `(${queueState.doctorName})` : ''}
          </Typography>
        </Box>
        <Chip
          icon={<span className="live-pulse" />}
          label={connected ? 'Live Stream Active' : 'Connecting to Stream...'}
          sx={{
            backgroundColor: connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            color: connected ? '#34d399' : '#fbbf24',
            borderColor: connected ? '#10b981' : '#f59e0b',
          }}
        />
      </Box>

      {showDoctorSelector && doctors.length > 0 && (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel sx={{ color: '#94a3b8' }}>Select Doctor Roster</InputLabel>
          <Select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
            sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
          >
            {doctors.map((doc) => (
              <MenuItem key={doc.id} value={doc.id}>
                {doc.fullName} ({doc.specialization})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Grid container spacing={3} textAlign="center">
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #0284c7', borderRadius: 3 }}>
            <ConfirmationNumberIcon sx={{ fontSize: 36, color: '#38bdf8' }} />
            <Typography variant="overline" display="block" color="#94a3b8" sx={{ fontSize: 11 }}>
              CURRENT SERVING TOKEN
            </Typography>
            <Typography variant="h3" fontWeight="800" color="#38bdf8">
              #{queueState.currentServingToken}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, background: 'rgba(13, 148, 136, 0.1)', border: '1px solid #0d9488', borderRadius: 3 }}>
            <ConfirmationNumberIcon sx={{ fontSize: 36, color: '#2dd4bf' }} />
            <Typography variant="overline" display="block" color="#94a3b8" sx={{ fontSize: 11 }}>
              NEXT UPCOMING TOKEN
            </Typography>
            <Typography variant="h3" fontWeight="800" color="#2dd4bf">
              #{queueState.nextUpcomingToken}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2.5, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: 3 }}>
            <AccessTimeIcon sx={{ fontSize: 36, color: '#fbbf24' }} />
            <Typography variant="overline" display="block" color="#94a3b8" sx={{ fontSize: 11 }}>
              TOTAL PATIENTS IN QUEUE
            </Typography>
            <Typography variant="h3" fontWeight="800" color="#fbbf24">
              {queueState.totalInQueue}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}
