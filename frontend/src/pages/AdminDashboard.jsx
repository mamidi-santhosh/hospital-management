import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Button, TextField, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, Alert, Tabs, Tab, MenuItem
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import axiosClient from '../api/axiosClient';

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);

  // General Status Message
  const [statusMsg, setStatusMsg] = useState('');

  // 1. Patient Registration State
  const [patFullName, setPatFullName] = useState('');
  const [patUsername, setPatUsername] = useState('');
  const [patEmail, setPatEmail] = useState('');
  const [patPassword, setPatPassword] = useState('');
  const [patPhone, setPatPhone] = useState('');
  const [patGender, setPatGender] = useState('Male');
  const [patBloodGroup, setPatBloodGroup] = useState('O+');

  // 2. Doctor Registration State
  const [docFullName, setDocFullName] = useState('');
  const [docUsername, setDocUsername] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docPhone, setDocPhone] = useState('');
  const [docSpecialization, setDocSpecialization] = useState('General Medicine');
  const [docQualification, setDocQualification] = useState('MD');
  const [docExperienceYears, setDocExperienceYears] = useState(5);
  const [docConsultationFee, setDocConsultationFee] = useState(150);

  // 3. Admin Appointment Booking State
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [bookPatientId, setBookPatientId] = useState('');
  const [bookDoctorId, setBookDoctorId] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];
  const [bookDate, setBookDate] = useState(todayStr);
  const [bookTime, setBookTime] = useState('10:00:00');
  const [bookReason, setBookReason] = useState('Admin Scheduled Consultation');
  const [recentAppointments, setRecentAppointments] = useState([]);

  // 4. Staff State
  const [staffList, setStaffList] = useState([]);
  const [staffName, setStaffName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Cardiology');
  const [salary, setSalary] = useState(5000);

  // 5. Inventory State
  const [inventory, setInventory] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Medicine');
  const [quantity, setQuantity] = useState(100);
  const [unitPrice, setUnitPrice] = useState(12.5);

  // 6. Billing State
  const [invoices, setInvoices] = useState([]);
  const [billingPatientId, setBillingPatientId] = useState(1);
  const [consultationFee, setConsultationFee] = useState(150);
  const [medicineCharges, setMedicineCharges] = useState(45);
  const [labTestCharges, setLabTestCharges] = useState(80);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (bookDoctorId) {
      fetchDoctorAppointments(bookDoctorId, bookDate);
    }
  }, [bookDoctorId, bookDate]);

  const fetchAdminData = async () => {
    try {
      // Fetch Patients Roster
      const patRes = await axiosClient.get('/patients');
      const patList = patRes.data.data || [];
      setPatients(patList);
      if (patList.length > 0 && !bookPatientId) {
        setBookPatientId(patList[0].id);
      }

      // Fetch Doctors Roster
      const docRes = await axiosClient.get('/doctors');
      const docList = docRes.data.data || [];
      setDoctors(docList);
      if (docList.length > 0 && !bookDoctorId) {
        setBookDoctorId(docList[0].id);
      }

      // Fetch Staff, Inventory, Alerts, Billing
      const staffRes = await axiosClient.get('/staff');
      setStaffList(staffRes.data.data || []);

      const invRes = await axiosClient.get('/inventory');
      setInventory(invRes.data.data || []);

      const alertRes = await axiosClient.get('/inventory/alerts/low-stock');
      setLowStockAlerts(alertRes.data.data || []);

      const invBillRes = await axiosClient.get('/billing/invoices/patient/1');
      setInvoices(invBillRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDoctorAppointments = async (docId, date) => {
    if (!docId) return;
    try {
      const res = await axiosClient.get(`/appointments/doctor/${docId}?date=${date}`);
      setRecentAppointments(res.data.data || []);
    } catch (e) {
      console.error(e);
      setRecentAppointments([]);
    }
  };

  // Register Patient Handler
  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      const authRes = await axiosClient.post('/auth/register', {
        username: patUsername,
        email: patEmail,
        password: patPassword,
        fullName: patFullName,
        phoneNumber: patPhone,
        role: 'ROLE_PATIENT',
      });
      const registeredUser = authRes.data.data;
      const userId = registeredUser.id;

      const patRes = await axiosClient.post('/patients', {
        userId,
        fullName: patFullName,
        phoneNumber: patPhone,
        gender: patGender,
        bloodGroup: patBloodGroup,
      });

      setStatusMsg(`Patient "${patFullName}" registered successfully (Patient ID #${patRes.data.data.id})!`);
      setPatFullName('');
      setPatUsername('');
      setPatEmail('');
      setPatPassword('');
      setPatPhone('');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setStatusMsg(err.response?.data?.detail || err.response?.data?.message || 'Failed to register patient.');
    }
  };

  // Register Doctor Handler
  const handleRegisterDoctor = async (e) => {
    e.preventDefault();
    try {
      let formattedName = docFullName;
      if (!formattedName.toLowerCase().startsWith('dr.')) {
        formattedName = `Dr. ${formattedName}`;
      }

      const authRes = await axiosClient.post('/auth/register', {
        username: docUsername,
        email: docEmail,
        password: docPassword,
        fullName: formattedName,
        phoneNumber: docPhone,
        role: 'ROLE_DOCTOR',
      });
      const registeredUser = authRes.data.data;
      const userId = registeredUser.id;

      const docRes = await axiosClient.post('/doctors', {
        userId,
        fullName: formattedName,
        specialization: docSpecialization,
        qualification: docQualification,
        experienceYears: Number(docExperienceYears),
        consultationFee: Number(docConsultationFee),
        availableDays: 'Mon-Fri',
        available: true,
      });

      setStatusMsg(`Doctor "${formattedName}" registered successfully (Doctor ID #${docRes.data.data.id})!`);
      setDocFullName('');
      setDocUsername('');
      setDocEmail('');
      setDocPassword('');
      setDocPhone('');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      setStatusMsg(err.response?.data?.detail || err.response?.data?.message || 'Failed to register doctor.');
    }
  };

  // Admin Book Appointment on Behalf of Patient
  const handleAdminBookAppointment = async (e) => {
    e.preventDefault();
    try {
      const selectedPat = patients.find((p) => p.id === Number(bookPatientId));
      const selectedDoc = doctors.find((d) => d.id === Number(bookDoctorId));

      if (!selectedPat || !selectedDoc) {
        setStatusMsg('Please select a valid patient and doctor.');
        return;
      }

      const payload = {
        patientId: selectedPat.id,
        patientName: selectedPat.fullName,
        doctorId: selectedDoc.id,
        doctorName: selectedDoc.fullName,
        appointmentDate: bookDate,
        appointmentTime: bookTime,
        fee: selectedDoc.consultationFee || 150.0,
        reason: bookReason,
      };

      const res = await axiosClient.post('/appointments/book', payload);
      setStatusMsg(`Saga Initiated! Appointment booked for ${selectedPat.fullName} with ${selectedDoc.fullName} (Token #${res.data.data.tokenNumber})`);
      fetchDoctorAppointments(selectedDoc.id, bookDate);
    } catch (err) {
      console.error(err);
      setStatusMsg(err.response?.data?.detail || err.response?.data?.message || 'Failed to book appointment.');
    }
  };

  // Add Staff Handler
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/staff', { fullName: staffName, designation, department, salary });
      setStatusMsg(`Added staff member ${staffName}`);
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // Add Inventory Handler
  const handleAddInventory = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/inventory', { itemName, category, quantity, reorderLevel: 20, unitPrice });
      setStatusMsg(`Added inventory item ${itemName}`);
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  // Create Invoice Handler
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/billing/invoices', {
        patientId: billingPatientId,
        patientName: 'John Doe',
        consultationFee,
        medicineCharges,
        labTestCharges,
        taxAmount: 15,
        paymentMethod: 'Credit Card',
      });
      setStatusMsg(`Invoice #${res.data.data.id} created! Total: $${res.data.data.totalAmount}`);
      fetchAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  const downloadInvoicePdf = (id) => {
    const token = localStorage.getItem('accessToken');
    window.open(`http://localhost:8080/api/v1/billing/invoices/${id}/pdf?token=${encodeURIComponent(token)}`, '_blank');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="700">
          Hospital Administration & Operations
        </Typography>
        <Typography variant="body1" color="#94a3b8">
          Register patients & doctors, book appointments on behalf of patients, manage staff, medicine inventory, and billing ledger
        </Typography>
      </Box>

      {statusMsg && (
        <Chip label={statusMsg} color="info" sx={{ mb: 3, p: 1, fontSize: 14 }} onDelete={() => setStatusMsg('')} />
      )}

      {lowStockAlerts.length > 0 && (
        <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 3 }}>
          Low Stock Warning: {lowStockAlerts.length} inventory items are below reorder threshold!
        </Alert>
      )}

      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 4 }} variant="scrollable" scrollButtons="auto">
        <Tab icon={<PersonAddIcon />} label="User Registration" sx={{ color: '#94a3b8' }} />
        <Tab icon={<CalendarMonthIcon />} label="Book Appointment" sx={{ color: '#94a3b8' }} />
        <Tab icon={<PeopleIcon />} label="Staff Roster" sx={{ color: '#94a3b8' }} />
        <Tab icon={<InventoryIcon />} label="Inventory & Medicines" sx={{ color: '#94a3b8' }} />
        <Tab icon={<ReceiptIcon />} label="Billing & PDF Invoices" sx={{ color: '#94a3b8' }} />
      </Tabs>

      {/* TAB 0: Patient & Doctor User Registration */}
      {tab === 0 && (
        <Grid container spacing={4}>
          {/* Register Patient Form */}
          <Grid item xs={12} md={6}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PersonAddIcon sx={{ color: '#38bdf8' }} />
                <Typography variant="h6" fontWeight="600">
                  Register New Patient
                </Typography>
              </Box>
              <Box component="form" onSubmit={handleRegisterPatient}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required label="Full Name" value={patFullName} onChange={(e) => setPatFullName(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required label="Username" value={patUsername} onChange={(e) => setPatUsername(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required type="email" label="Email Address" value={patEmail} onChange={(e) => setPatEmail(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required type="password" label="Password" value={patPassword} onChange={(e) => setPatPassword(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone Number" value={patPhone} onChange={(e) => setPatPhone(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField select fullWidth label="Gender" value={patGender} onChange={(e) => setPatGender(e.target.value)} sx={{ select: { color: '#fff' } }}>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField select fullWidth label="Blood Group" value={patBloodGroup} onChange={(e) => setPatBloodGroup(e.target.value)} sx={{ select: { color: '#fff' } }}>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <MenuItem key={bg} value={bg}>{bg}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, py: 1.2, background: 'linear-gradient(90deg, #0284c7, #0d9488)' }}>
                  Register Patient Account
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Register Doctor Form */}
          <Grid item xs={12} md={6}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <MedicalServicesIcon sx={{ color: '#10b981' }} />
                <Typography variant="h6" fontWeight="600">
                  Register New Doctor
                </Typography>
              </Box>
              <Box component="form" onSubmit={handleRegisterDoctor}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required label="Full Name (e.g. Dr. Sarah Jenkins)" value={docFullName} onChange={(e) => setDocFullName(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required label="Username" value={docUsername} onChange={(e) => setDocUsername(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required type="email" label="Email Address" value={docEmail} onChange={(e) => setDocEmail(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth required type="password" label="Password" value={docPassword} onChange={(e) => setDocPassword(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Phone Number" value={docPhone} onChange={(e) => setDocPhone(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Specialization" value={docSpecialization} onChange={(e) => setDocSpecialization(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth label="Qualification" value={docQualification} onChange={(e) => setDocQualification(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth type="number" label="Experience (Years)" value={docExperienceYears} onChange={(e) => setDocExperienceYears(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField fullWidth type="number" label="Consultation Fee ($)" value={docConsultationFee} onChange={(e) => setDocConsultationFee(e.target.value)} sx={{ input: { color: '#fff' } }} />
                  </Grid>
                </Grid>
                <Button type="submit" fullWidth variant="contained" color="success" sx={{ mt: 3, py: 1.2, background: 'linear-gradient(90deg, #10b981, #059669)' }}>
                  Register Doctor Account
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Registered Users Roster Overview */}
          <Grid item xs={12}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Registered System Profiles Summary
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="600" color="#38bdf8" mb={1}>
                    Registered Patients ({patients.length})
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#94a3b8' }}>ID</TableCell>
                        <TableCell sx={{ color: '#94a3b8' }}>Patient Name</TableCell>
                        <TableCell sx={{ color: '#94a3b8' }}>Gender</TableCell>
                        <TableCell sx={{ color: '#94a3b8' }}>Blood Group</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {patients.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell sx={{ color: '#38bdf8' }}>#{p.id}</TableCell>
                          <TableCell sx={{ color: '#fff' }}>{p.fullName}</TableCell>
                          <TableCell sx={{ color: '#94a3b8' }}>{p.gender || 'N/A'}</TableCell>
                          <TableCell sx={{ color: '#10b981' }}>{p.bloodGroup || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="600" color="#10b981" mb={1}>
                    Registered Doctors ({doctors.length})
                  </Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#94a3b8' }}>ID</TableCell>
                        <TableCell sx={{ color: '#94a3b8' }}>Doctor Name</TableCell>
                        <TableCell sx={{ color: '#94a3b8' }}>Specialization</TableCell>
                        <TableCell sx={{ color: '#94a3b8' }}>Fee ($)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {doctors.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell sx={{ color: '#10b981' }}>#{d.id}</TableCell>
                          <TableCell sx={{ color: '#fff' }}>{d.fullName}</TableCell>
                          <TableCell sx={{ color: '#94a3b8' }}>{d.specialization}</TableCell>
                          <TableCell sx={{ color: '#fbbf24', fontWeight: 600 }}>${d.consultationFee}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: Book Appointment on Behalf of Registered Users */}
      {tab === 1 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CalendarMonthIcon sx={{ color: '#38bdf8' }} />
                <Typography variant="h6" fontWeight="600">
                  Book Appointment (Kafka Saga)
                </Typography>
              </Box>
              <Box component="form" onSubmit={handleAdminBookAppointment}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Select Patient"
                  margin="normal"
                  value={bookPatientId}
                  onChange={(e) => setBookPatientId(Number(e.target.value))}
                  sx={{ select: { color: '#fff' } }}
                >
                  {patients.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      #{p.id} - {p.fullName} ({p.phoneNumber || 'Patient'})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  fullWidth
                  required
                  label="Select Doctor Roster"
                  margin="normal"
                  value={bookDoctorId}
                  onChange={(e) => setBookDoctorId(Number(e.target.value))}
                  sx={{ select: { color: '#fff' } }}
                >
                  {doctors.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.fullName} - {d.specialization} (${d.consultationFee})
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  fullWidth
                  type="date"
                  label="Appointment Date"
                  margin="normal"
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ input: { color: '#fff' } }}
                />

                <TextField
                  fullWidth
                  label="Appointment Time"
                  margin="normal"
                  value={bookTime}
                  onChange={(e) => setBookTime(e.target.value)}
                  sx={{ input: { color: '#fff' } }}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Reason for Visit / Symptoms"
                  margin="normal"
                  value={bookReason}
                  onChange={(e) => setBookReason(e.target.value)}
                  sx={{ textarea: { color: '#fff' } }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  sx={{ mt: 3, py: 1.5, background: 'linear-gradient(90deg, #0284c7, #0d9488)' }}
                >
                  Book Appointment on Behalf
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Doctor Roster Queue & Scheduled Appointments
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#94a3b8' }}>Token #</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Patient Name</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Doctor</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Time</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Status</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentAppointments.map((appt) => (
                    <TableRow key={appt.id}>
                      <TableCell sx={{ color: '#38bdf8', fontWeight: 800, fontSize: 18 }}>#{appt.tokenNumber}</TableCell>
                      <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{appt.patientName}</TableCell>
                      <TableCell sx={{ color: '#10b981' }}>{appt.doctorName}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{appt.appointmentTime}</TableCell>
                      <TableCell>
                        <Chip
                          label={appt.status}
                          color={appt.status === 'COMPLETED' ? 'success' : appt.status === 'IN_PROGRESS' ? 'info' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>{appt.reason}</TableCell>
                    </TableRow>
                  ))}
                  {recentAppointments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: '#94a3b8' }}>
                        No appointments currently scheduled for the selected doctor on {bookDate}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 2: Staff Roster Tab */}
      {tab === 2 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Add Staff Member
              </Typography>
              <Box component="form" onSubmit={handleAddStaff}>
                <TextField fullWidth label="Full Name" margin="dense" value={staffName} onChange={(e) => setStaffName(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <TextField fullWidth label="Designation" margin="dense" value={designation} onChange={(e) => setDesignation(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <TextField fullWidth label="Department" margin="dense" value={department} onChange={(e) => setDepartment(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <TextField fullWidth type="number" label="Monthly Salary ($)" margin="dense" value={salary} onChange={(e) => setSalary(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, background: 'linear-gradient(90deg, #0284c7, #0d9488)' }}>
                  Add Staff
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Current Hospital Staff Roster
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#94a3b8' }}>ID</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Name</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Designation</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Department</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Salary</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffList.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell sx={{ color: '#38bdf8' }}>#{s.id}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{s.fullName}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{s.designation}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{s.department}</TableCell>
                      <TableCell sx={{ color: '#10b981', fontWeight: 600 }}>${s.salary}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 3: Inventory Tab */}
      {tab === 3 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Add Inventory Item
              </Typography>
              <Box component="form" onSubmit={handleAddInventory}>
                <TextField fullWidth label="Item Name" margin="dense" value={itemName} onChange={(e) => setItemName(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <TextField fullWidth label="Category" margin="dense" value={category} onChange={(e) => setCategory(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <TextField fullWidth type="number" label="Quantity" margin="dense" value={quantity} onChange={(e) => setQuantity(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <TextField fullWidth type="number" label="Unit Price ($)" margin="dense" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, background: 'linear-gradient(90deg, #0284c7, #0d9488)' }}>
                  Save Stock Item
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Medicine & Supplies Inventory Tracking
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#94a3b8' }}>Item Name</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Category</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Quantity</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Unit Price</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Stock Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell sx={{ color: '#fff', fontWeight: 600 }}>{item.itemName}</TableCell>
                      <TableCell sx={{ color: '#94a3b8' }}>{item.category}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{item.quantity}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>${item.unitPrice}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.quantity <= item.reorderLevel ? 'LOW STOCK' : 'IN STOCK'}
                          color={item.quantity <= item.reorderLevel ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* TAB 4: Billing Tab */}
      {tab === 4 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Generate Patient Invoice
              </Typography>
              <Box component="form" onSubmit={handleCreateInvoice}>
                <TextField fullWidth type="number" label="Consultation Fee ($)" margin="dense" value={consultationFee} onChange={(e) => setConsultationFee(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <TextField fullWidth type="number" label="Medicine Charges ($)" margin="dense" value={medicineCharges} onChange={(e) => setMedicineCharges(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <TextField fullWidth type="number" label="Lab Test Charges ($)" margin="dense" value={labTestCharges} onChange={(e) => setLabTestCharges(e.target.value)} sx={{ input: { color: '#fff' } }} />
                <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, background: 'linear-gradient(90deg, #0284c7, #0d9488)' }}>
                  Issue Invoice Receipt
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="600" mb={2}>
                Billing Ledger & PDF Receipts
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#94a3b8' }}>Invoice #</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Patient</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Total Amount</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Status</TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell sx={{ color: '#38bdf8' }}>#INV-{inv.id}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{inv.patientName}</TableCell>
                      <TableCell sx={{ color: '#10b981', fontWeight: 700 }}>${inv.totalAmount}</TableCell>
                      <TableCell>
                        <Chip label={inv.status} color={inv.status === 'PAID' ? 'success' : 'warning'} size="small" />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<PictureAsPdfIcon />}
                          sx={{ color: '#ef4444', borderColor: '#ef4444' }}
                          onClick={() => downloadInvoicePdf(inv.id)}
                        >
                          Invoice PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
