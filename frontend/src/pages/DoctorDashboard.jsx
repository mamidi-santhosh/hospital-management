import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axiosClient from '../api/axiosClient';

export default function DoctorDashboard() {
  const doctorId = 1; // Dr. Sarah Jenkins
  const [appointments, setAppointments] = useState([]);
  const [openPrescriptionDialog, setOpenPrescriptionDialog] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState('');
  const [instructions, setInstructions] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchDoctorQueue();
  }, []);

  const fetchDoctorQueue = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axiosClient.get(`/appointments/doctor/${doctorId}?date=${today}`);
      setAppointments(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (apptId, status) => {
    try {
      await axiosClient.put(`/appointments/${apptId}/status?status=${status}`);
      setStatusMsg(`Updated appointment #${apptId} to ${status}`);
      fetchDoctorQueue();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePrescription = async () => {
    if (!selectedAppt) return;
    try {
      await axiosClient.post('/prescriptions', {
        patientId: selectedAppt.patientId,
        patientName: selectedAppt.patientName,
        doctorId: doctorId,
        doctorName: selectedAppt.doctorName,
        diagnosis,
        medicines,
        instructions,
      });
      setStatusMsg(`Prescription issued successfully for ${selectedAppt.patientName}`);
      setOpenPrescriptionDialog(false);
      setDiagnosis('');
      setMedicines('');
      setInstructions('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="700">
          Doctor Clinical Portal
        </Typography>
        <Typography variant="body1" color="#94a3b8">
          Manage patient queue consultations, EMR logs, and write digital prescriptions
        </Typography>
      </Box>

      {statusMsg && (
        <Chip label={statusMsg} color="success" sx={{ mb: 3, p: 1, fontSize: 14 }} onDelete={() => setStatusMsg('')} />
      )}

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <MedicalServicesIcon sx={{ color: '#0d9488', fontSize: 32 }} />
              <Typography variant="h6" fontWeight="600">
                Today's Consultation Patient Queue
              </Typography>
            </Box>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#94a3b8' }}>Token #</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Patient Name</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Time Slot</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Status</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Reason</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appt) => (
                  <TableRow key={appt.id}>
                    <TableCell sx={{ color: '#38bdf8', fontWeight: 800, fontSize: 18 }}>#{appt.tokenNumber}</TableCell>
                    <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{appt.patientName}</TableCell>
                    <TableCell sx={{ color: '#fff' }}>{appt.appointmentTime}</TableCell>
                    <TableCell>
                      <Chip label={appt.status} color={appt.status === 'COMPLETED' ? 'success' : appt.status === 'IN_PROGRESS' ? 'info' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{appt.reason}</TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          color="info"
                          size="small"
                          onClick={() => handleUpdateStatus(appt.id, 'IN_PROGRESS')}
                        >
                          Call Patient
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                        >
                          Complete
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditNoteIcon />}
                          onClick={() => {
                            setSelectedAppt(appt);
                            setOpenPrescriptionDialog(true);
                          }}
                        >
                          Write Prescription
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: '#94a3b8' }}>
                      No patients currently scheduled for today.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      {/* Prescription Dialog */}
      <Dialog open={openPrescriptionDialog} onClose={() => setOpenPrescriptionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ background: '#1e293b', color: '#fff' }}>
          Issue Prescription for {selectedAppt?.patientName}
        </DialogTitle>
        <DialogContent sx={{ background: '#0f172a', pt: 2 }}>
          <TextField
            fullWidth
            label="Diagnosis"
            margin="normal"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            sx={{ input: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Prescribed Medicines & Dosage"
            margin="normal"
            placeholder="e.g. Amoxicillin 500mg - 1 tab after meals twice daily (5 days)"
            value={medicines}
            onChange={(e) => setMedicines(e.target.value)}
            sx={{ textarea: { color: '#fff' } }}
          />
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Special Instructions"
            margin="normal"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            sx={{ textarea: { color: '#fff' } }}
          />
        </DialogContent>
        <DialogActions sx={{ background: '#1e293b', p: 2 }}>
          <Button onClick={() => setOpenPrescriptionDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleCreatePrescription}>
            Issue Prescription PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
