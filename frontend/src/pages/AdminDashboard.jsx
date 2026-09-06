import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Button, TextField, Table, TableHead, TableRow, TableCell, TableBody, Chip, Alert, Tabs, Tab } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import axiosClient from '../api/axiosClient';

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);

  // Staff state
  const [staffList, setStaffList] = useState([]);
  const [staffName, setStaffName] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Cardiology');
  const [salary, setSalary] = useState(5000);

  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Medicine');
  const [quantity, setQuantity] = useState(100);
  const [unitPrice, setUnitPrice] = useState(12.5);

  // Billing state
  const [invoices, setInvoices] = useState([]);
  const [patientId, setPatientId] = useState(1);
  const [consultationFee, setConsultationFee] = useState(150);
  const [medicineCharges, setMedicineCharges] = useState(45);
  const [labTestCharges, setLabTestCharges] = useState(80);

  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
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

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post('/billing/invoices', {
        patientId,
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
          Staff management, medicine inventory control with reorder alerts, and billing ledger
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

      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 4 }}>
        <Tab icon={<PeopleIcon />} label="Staff Roster" sx={{ color: '#94a3b8' }} />
        <Tab icon={<InventoryIcon />} label="Inventory & Medicines" sx={{ color: '#94a3b8' }} />
        <Tab icon={<ReceiptIcon />} label="Billing & PDF Invoices" sx={{ color: '#94a3b8' }} />
      </Tabs>

      {/* Staff Roster Tab */}
      {tab === 0 && (
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

      {/* Inventory Tab */}
      {tab === 1 && (
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

      {/* Billing Tab */}
      {tab === 2 && (
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
