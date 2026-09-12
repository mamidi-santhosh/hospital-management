import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Button, TextField, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSelector } from 'react-redux';
import axiosClient from '../api/axiosClient';
import LiveTokenWidget from '../components/LiveTokenWidget';

export default function DoctorDashboard() {
  const { user } = useSelector((state) => state.auth);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [openPrescriptionDialog, setOpenPrescriptionDialog] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);

  const [diagnosis, setDiagnosis] = useState('');
  const [medicines, setMedicines] = useState('');
  const [instructions, setInstructions] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const isAdmin = user?.role === 'ROLE_ADMIN';

  useEffect(() => {
    fetchDoctors();
  }, [user]);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchDoctorQueue(selectedDoctorId);
    }
  }, [selectedDoctorId]);

  const fetchDoctors = async () => {
    try {
      const res = await axiosClient.get('/doctors');
      const docList = res.data.data || [];
      setDoctors(docList);

      if (user?.role === 'ROLE_DOCTOR' && user?.id) {
        try {
          const userDocRes = await axiosClient.get(
            `/doctors/user/${user.id}?username=${encodeURIComponent(user.username || '')}&fullName=${encodeURIComponent(user.fullName || '')}`
          );
          const myDoc = userDocRes.data.data;
          if (myDoc) {
            setSelectedDoctorId(myDoc.id);
            if (!docList.some((d) => d.id === myDoc.id)) {
              setDoctors([...docList, myDoc]);
            }
          }
        } catch (err) {
          console.error('Failed to fetch doctor profile by userId:', err);
        }
      } else {
        if (docList.length > 0) {
          setSelectedDoctorId(docList[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDoctorQueue = async (docId = selectedDoctorId) => {
    if (!docId) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await axiosClient.get(`/appointments/doctor/${docId}?date=${today}`);
      setAppointments(res.data.data || []);
    } catch (e) {
      console.error(e);
      setAppointments([]);
    }
  };

  const handleUpdateStatus = async (apptId, status) => {
    try {
      await axiosClient.put(`/appointments/${apptId}/status?status=${status}`);
      setStatusMsg(`Updated appointment #${apptId} to ${status}`);
      fetchDoctorQueue(selectedDoctorId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePrescription = async () => {
    if (!selectedAppt) return;
    try {
      const currentDoc = doctors.find((d) => d.id === selectedDoctorId);
      
      // Issue Prescription without forcing appointment completion until doctor explicitly clicks Complete
      await axiosClient.post('/prescriptions', {
        appointmentId: selectedAppt.id,
        patientId: selectedAppt.patientId,
        patientName: selectedAppt.patientName,
        doctorId: selectedDoctorId,
        doctorName: currentDoc ? currentDoc.fullName : selectedAppt.doctorName,
        diagnosis,
        medicines,
        instructions,
      });

      setStatusMsg(`Prescription issued successfully for ${selectedAppt.patientName}. Mark appointment as Completed when finished.`);
      setOpenPrescriptionDialog(false);
      setDiagnosis('');
      setMedicines('');
      setInstructions('');
      fetchDoctorQueue(selectedDoctorId);
    } catch (e) {
      console.error(e);
      setStatusMsg('Failed to issue prescription.');
    }
  };

  const selectedDoctorObj = doctors.find((d) => d.id === selectedDoctorId);
  const doctorDisplayName = selectedDoctorObj
    ? selectedDoctorObj.fullName
    : user?.fullName || user?.username || `Doctor #${selectedDoctorId || ''}`;

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight="700">
            Doctor Clinical Portal ({doctorDisplayName})
          </Typography>
          <Typography variant="body1" color="#94a3b8">
            Manage patient queue consultations, EMR logs, and write digital prescriptions
          </Typography>
        </Box>

        {/* Show Doctor Selector ONLY to Administrators */}
        {isAdmin && doctors.length > 0 && (
          <TextField
            select
            label="Select Doctor Roster (Admin View)"
            value={selectedDoctorId || ''}
            onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
            sx={{ minWidth: 280, select: { color: '#fff' } }}
          >
            {doctors.map((doc) => (
              <MenuItem key={doc.id} value={doc.id}>
                {doc.fullName} - {doc.specialization}
              </MenuItem>
            ))}
          </TextField>
        )}
      </Box>

      {statusMsg && (
        <Chip label={statusMsg} color="success" sx={{ mb: 3, p: 1, fontSize: 14 }} onDelete={() => setStatusMsg('')} />
      )}

      {/* Live Queue Tracker Widget strictly for Logged-In Doctor */}
      {selectedDoctorId && <LiveTokenWidget doctorId={selectedDoctorId} showDoctorSelector={isAdmin} />}

      <Grid container spacing={4}>
        <Grid item xs={12}>
          <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <MedicalServicesIcon sx={{ color: '#0d9488', fontSize: 32 }} />
              <Typography variant="h6" fontWeight="600">
                Today's Consultation Patient Queue ({doctorDisplayName})
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
                {appointments.map((appt) => {
                  const isCompleted = appt.status === 'COMPLETED';

                  return (
                    <TableRow key={appt.id}>
                      <TableCell sx={{ color: '#38bdf8', fontWeight: 800, fontSize: 18 }}>#{appt.tokenNumber}</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{appt.patientName}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{appt.appointmentTime}</TableCell>
                      <TableCell>
                        <Chip
                          label={appt.status}
                          color={isCompleted ? 'success' : appt.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>{appt.reason}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button
                            variant="contained"
                            color="info"
                            size="small"
                            disabled={isCompleted}
                            onClick={() => handleUpdateStatus(appt.id, 'IN_PROGRESS')}
                          >
                            Call Patient
                          </Button>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            disabled={isCompleted}
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleUpdateStatus(appt.id, 'COMPLETED')}
                          >
                            {isCompleted ? 'Completed' : 'Complete'}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            disabled={isCompleted}
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
                  );
                })}
                {appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: '#94a3b8' }}>
                      No patients currently scheduled for {doctorDisplayName} today.
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
            Save Prescription PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
