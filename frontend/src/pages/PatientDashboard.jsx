import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Button, TextField, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Chip, Card, CardContent } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import { useSelector } from 'react-redux';
import axiosClient from '../api/axiosClient';
import LiveTokenWidget from '../components/LiveTokenWidget';

export default function PatientDashboard() {
  const { user } = useSelector((state) => state.auth);
  const patientId = user?.id || 1;
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];
  const [appointmentDate, setAppointmentDate] = useState(todayStr);
  const [appointmentTime, setAppointmentTime] = useState('10:00:00');
  const [reason, setReason] = useState('Routine Health Checkup');
  const [appointments, setAppointments] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchInitialData(patientId);
  }, [patientId]);

  const fetchInitialData = async (targetPatientId = patientId) => {
    try {
      // Fetch Doctors Roster
      const docRes = await axiosClient.get('/doctors');
      const docList = docRes.data.data || [];
      setDoctors(docList);

      if (docList.length > 0 && !selectedDoctor) {
        setSelectedDoctor(docList[0].id);
      }

      // Fetch Patient Appointments
      const apptRes = await axiosClient.get(`/appointments/patient/${targetPatientId}`);
      setAppointments(apptRes.data.data || []);

      // Fetch EMR History
      const histRes = await axiosClient.get(`/patients/${targetPatientId}/medical-history`);
      setMedicalHistory(histRes.data.data || []);

      // Fetch Prescriptions
      const prescRes = await axiosClient.get(`/prescriptions/patient/${targetPatientId}`);
      setPrescriptions(prescRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const docObj = doctors.find((d) => d.id === selectedDoctor);
      const payload = {
        patientId,
        patientName: user?.fullName || user?.username || 'Patient',
        doctorId: selectedDoctor,
        doctorName: docObj ? docObj.fullName : 'Dr. Sarah Jenkins',
        appointmentDate,
        appointmentTime,
        fee: docObj ? docObj.consultationFee : 150.00,
        reason,
      };

      const res = await axiosClient.post('/appointments/book', payload);
      setStatusMsg(`Saga Event Initiated! Booked Appointment Token #${res.data.data.tokenNumber}`);
      fetchInitialData(patientId);
    } catch (err) {
      setStatusMsg('Failed to book appointment.');
    }
  };

  const downloadPrescriptionPdf = async (id) => {
    if (!id) return;
    try {
      const response = await axiosClient.get(`/prescriptions/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Prescription_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Blob PDF download failed, using fallback:', e);
      const token = localStorage.getItem('accessToken');
      window.open(`http://localhost:8080/api/v1/prescriptions/${id}/pdf?token=${encodeURIComponent(token)}`, '_blank');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="700">
          Patient Healthcare Portal ({user?.fullName || user?.username || 'Patient'})
        </Typography>
        <Typography variant="body1" color="#94a3b8">
          Manage your health records, appointment bookings, and prescription downloads
        </Typography>
      </Box>

      {statusMsg && (
        <Chip label={statusMsg} color="info" sx={{ mb: 3, p: 1, fontSize: 14 }} onDelete={() => setStatusMsg('')} />
      )}

      {/* Live Queue Tracker wrto Doctor for Patients Selection */}
      <LiveTokenWidget doctorId={selectedDoctor} showDoctorSelector={true} />

      <Grid container spacing={4}>
        {/* Book Appointment Card */}
        <Grid item xs={12} md={4}>
          <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <CalendarMonthIcon sx={{ color: '#38bdf8' }} />
              <Typography variant="h6" fontWeight="600">
                Book Appointment (Kafka Saga)
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleBookAppointment}>
              <TextField
                select
                fullWidth
                label="Select Doctor"
                margin="normal"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(Number(e.target.value))}
                sx={{ select: { color: '#fff' } }}
              >
                {doctors.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>
                    {doc.fullName} - {doc.specialization} (${doc.consultationFee})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                type="date"
                label="Appointment Date"
                margin="normal"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: todayStr }}
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                sx={{ input: { color: '#fff' } }}
              />

              <TextField
                fullWidth
                type="time"
                label="Appointment Time"
                margin="normal"
                InputLabelProps={{ shrink: true }}
                value={appointmentTime}
                onChange={(e) => setAppointmentTime(e.target.value)}
                sx={{ input: { color: '#fff' } }}
              />

              <TextField
                fullWidth
                label="Reason / Symptoms"
                margin="normal"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                sx={{ input: { color: '#fff' } }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ mt: 3, background: 'linear-gradient(90deg, #0284c7, #0d9488)', borderRadius: 2 }}
              >
                Schedule & Issue Token
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* My Appointments & Prescriptions */}
        <Grid item xs={12} md={8}>
          {/* Scheduled Appointments */}
          <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3, mb: 4 }}>
            <Typography variant="h6" fontWeight="600" mb={2}>
              My Scheduled Appointments
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#94a3b8' }}>Token #</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Doctor</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Date & Time</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Status</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Reason</TableCell>
                  <TableCell sx={{ color: '#94a3b8' }}>Prescription PDF</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.map((appt) => {
                  // 1. Direct appointmentId match for new appointments
                  let matchingPrescription = prescriptions.find((p) => p.appointmentId === appt.id);

                  // 2. Legacy fallback match by doctor, patient, and chronological position index
                  if (!matchingPrescription) {
                    const docPrescriptions = prescriptions.filter(
                      (p) =>
                        (p.patientId === appt.patientId || p.patientId === patientId) &&
                        (p.doctorId === appt.doctorId || (p.doctorName && appt.doctorName && p.doctorName.toLowerCase() === appt.doctorName.toLowerCase()))
                    );

                    const completedAppts = appointments.filter(
                      (a) => (a.doctorId === appt.doctorId || a.doctorName === appt.doctorName) && (a.status === 'COMPLETED' || a.id === appt.id)
                    );
                    const apptIndex = completedAppts.findIndex((a) => a.id === appt.id);

                    if (apptIndex >= 0 && apptIndex < docPrescriptions.length) {
                      matchingPrescription = docPrescriptions[docPrescriptions.length - 1 - apptIndex];
                    } else if (docPrescriptions.length === 1 && appt.status === 'COMPLETED') {
                      matchingPrescription = docPrescriptions[0];
                    }
                  }

                  return (
                    <TableRow key={appt.id}>
                      <TableCell sx={{ color: '#38bdf8', fontWeight: 700 }}>#{appt.tokenNumber}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{appt.doctorName}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{appt.appointmentDate} {appt.appointmentTime}</TableCell>
                      <TableCell>
                        <Chip label={appt.status} size="small" color={appt.status === 'COMPLETED' ? 'success' : appt.status === 'CONFIRMED' ? 'info' : 'warning'} />
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>{appt.reason}</TableCell>
                      <TableCell>
                        {matchingPrescription ? (
                          <Button
                            variant="contained"
                            size="small"
                            color="error"
                            startIcon={<PictureAsPdfIcon />}
                            onClick={() => downloadPrescriptionPdf(matchingPrescription.id)}
                            sx={{ borderRadius: 2 }}
                          >
                            Download PDF
                          </Button>
                        ) : (
                          <Typography variant="caption" color="#94a3b8">
                            {appt.status === 'COMPLETED' ? 'No Prescription Issued' : 'Pending Consultation'}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {appointments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: '#94a3b8' }}>
                      No appointments booked yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>

          {/* Prescriptions with PDF download */}
          <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PictureAsPdfIcon sx={{ color: '#ef4444' }} />
              <Typography variant="h6" fontWeight="600">
                Medical Prescriptions (OpenPDF Export)
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {prescriptions.map((p) => (
                <Grid item xs={12} sm={6} key={p.id}>
                  <Card sx={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight="700" color="#38bdf8">
                        Prescription #{p.id}
                      </Typography>
                      <Typography variant="body2" color="#94a3b8">
                        Doctor: {p.doctorName}
                      </Typography>
                      <Typography variant="body2" color="#94a3b8">
                        Diagnosis: {p.diagnosis}
                      </Typography>
                      <Typography variant="body2" color="#fff" sx={{ mt: 1 }}>
                        Meds: {p.medicines}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PictureAsPdfIcon />}
                        sx={{ mt: 2, color: '#ef4444', borderColor: '#ef4444' }}
                        onClick={() => downloadPrescriptionPdf(p.id)}
                      >
                        Download PDF
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {prescriptions.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="#94a3b8">
                    No prescriptions found.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
