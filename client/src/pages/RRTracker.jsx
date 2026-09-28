import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, LinearProgress, Chip, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment,
  IconButton, MenuItem, Select, FormControl, InputLabel, Tabs, Tab,
  Divider, Alert, Tooltip, Grid, Paper, Collapse, List, ListItem,
  ListItemText, ListItemIcon, Snackbar, Checkbox, FormControlLabel,
  Stack, Badge, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Search, AccountBalance, Gavel, Print, ExpandMore, ExpandLess,
  CheckCircle, Warning, CurrencyRupee, Assessment, Receipt,
  ArrowForward, Refresh, FilterList, Download, AccountBalanceWallet,
  PendingActions, MoneyOff, TrendingUp, Info, Close, HourglassEmpty,
  Calculate, Send, AssignmentLate, Shield, Help, CheckBox,
  CheckBoxOutlineBlank, AddCircle, PlaylistAddCheck, ReportProblem
} from '@mui/icons-material';
import { getSocket } from '../services/socket';

const API = 'http://localhost:5000/api/rr';

// ── Summary Stats Card ──────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, sub }) {
  return (
    <Paper elevation={0} sx={{
      p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider',
      display: 'flex', alignItems: 'center', gap: 2, minWidth: 0,
      transition: 'box-shadow 0.2s', '&:hover': { boxShadow: 4 },
      bgcolor: '#FFFFFF'
    }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: 2,
        bgcolor: `${color}.50`, display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}>
        {React.cloneElement(icon, { sx: { color: `${color}.main`, fontSize: 26 } })}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
        <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Plus Jakarta Sans' }}>{value}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </Box>
    </Paper>
  );
}

// ── Statutory Compensation Calculator Modal (LARR Act 2013) ──────────────────
function StatutoryCalculatorDialog({ open, onClose, onAwardCreated }) {
  const [areaAcres, setAreaAcres] = useState(2.5);
  const [landUse, setLandUse] = useState('Agricultural (Wet)');
  const [state, setState] = useState('Karnataka');
  const [circleRate, setCircleRate] = useState(2000000);
  const [isRural, setIsRural] = useState(true);
  const [ruralMultiplier, setRuralMultiplier] = useState(1.5); // 1.0 to 2.0
  const [treeValuation, setTreeValuation] = useState(75000);
  const [structureValuation, setStructureValuation] = useState(150000);
  const [includeSubsistence, setIncludeSubsistence] = useState(true);
  const [includeResettlement, setIncludeResettlement] = useState(true);
  const [includeCattleShed, setIncludeCattleShed] = useState(true);

  // Beneficiary details to save
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [surveyNo, setSurveyNo] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [saving, setSaving] = useState(false);

  // Suggested circle rates per state & land use
  const baseRates = {
    'Agricultural (Wet)': 2200000,
    'Agricultural (Dry)': 1400000,
    'Residential / Abadi': 4800000,
    'Commercial Hub': 8500000,
    'Industrial Corridor': 6000000
  };

  useEffect(() => {
    if (baseRates[landUse]) {
      setCircleRate(baseRates[landUse]);
    }
  }, [landUse]);

  // Calculations under RFCTLARR Act 2013
  const mult = isRural ? Number(ruralMultiplier) : 1.0;
  const baseLandValue = Math.round(Number(areaAcres || 0) * Number(circleRate || 0));
  const marketValue = Math.round(baseLandValue * mult);
  const assetsValue = Number(treeValuation || 0) + Number(structureValuation || 0);
  const totalMarketValueWithAssets = marketValue + assetsValue;
  // Solatium is 100% of market value of land + assets
  const solatium = Math.round(totalMarketValueWithAssets * 1.0);

  // Additional R&R allowances
  const additionalBenefits = [];
  if (includeSubsistence) additionalBenefits.push({ type: 'Subsistence Allowance (12 Months)', amount: 36000 });
  if (includeResettlement) additionalBenefits.push({ type: 'Resettlement & Transportation Grant', amount: 50000 });
  if (includeCattleShed) additionalBenefits.push({ type: 'Cattle Shed / Artisan Grant', amount: 25000 });
  const stampDutyReimbursement = Math.round(Number(areaAcres || 0) * 12000);
  additionalBenefits.push({ type: 'Stamp Duty Exemption / Reimbursement', amount: stampDutyReimbursement });

  const totalAllowances = additionalBenefits.reduce((s, b) => s + b.amount, 0);
  const totalStatutoryAward = totalMarketValueWithAssets + solatium + totalAllowances;

  const handleCreateAward = async () => {
    if (!beneficiaryName.trim() || !surveyNo.trim()) {
      alert('Please enter Beneficiary Name and Survey Number');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        beneficiary_name: beneficiaryName,
        survey_no: surveyNo,
        land_name: `${village || 'Gram'} Parcel ${surveyNo}`,
        state,
        state_code: state === 'Karnataka' ? 'KA' : state === 'Maharashtra' ? 'MH' : state === 'Tamil Nadu' ? 'TN' : 'IN',
        district: district || 'Central District',
        taluk: 'Taluk-1',
        village: village || 'Village-1',
        area_acres: Number(areaAcres),
        land_use: landUse,
        market_rate_per_acre: Number(circleRate),
        market_value: totalMarketValueWithAssets,
        multiplier_factor: mult,
        solatium_amount: solatium,
        additional_benefits: additionalBenefits,
        acquisition_purpose: 'National Highway Expansion (NHAI)',
        acquiring_body: 'National Highways Authority of India'
      };
      const res = await fetch(`${API}/beneficiaries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        onAwardCreated(data);
        onClose();
      } else {
        alert(data.error || 'Failed to create award');
      }
    } catch (err) {
      alert('Network error while saving award');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
      <DialogTitle sx={{
        fontWeight: 800, fontFamily: 'Plus Jakarta Sans', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Calculate color="primary" />
          Statutory R&R Compensation Calculator (LARR Act 2013)
        </Box>
        <IconButton onClick={onClose}><Close /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          Calculates statutory compensation strictly compliant with <strong>First Schedule & Sections 26-30 of the RFCTLARR Act 2013</strong> (Market Value × Multiplier + 100% Solatium + R&R Allowances).
        </Alert>

        <Grid container spacing={2}>
          {/* Left: Input Parameters */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              1. Land & Valuation Parameters
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Land Area (Acres)" type="number"
                  value={areaAcres} onChange={e => setAreaAcres(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Land Use</InputLabel>
                  <Select value={landUse} onChange={e => setLandUse(e.target.value)} label="Land Use">
                    <MenuItem value="Agricultural (Wet)">Agricultural (Wet)</MenuItem>
                    <MenuItem value="Agricultural (Dry)">Agricultural (Dry)</MenuItem>
                    <MenuItem value="Residential / Abadi">Residential / Abadi</MenuItem>
                    <MenuItem value="Commercial Hub">Commercial Hub</MenuItem>
                    <MenuItem value="Industrial Corridor">Industrial Corridor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>State</InputLabel>
                  <Select value={state} onChange={e => setState(e.target.value)} label="State">
                    {['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Rajasthan', 'Gujarat', 'Uttar Pradesh'].map(s => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Circle Rate / Acre (₹)" type="number"
                  value={circleRate} onChange={e => setCircleRate(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={<Checkbox checked={isRural} onChange={e => setIsRural(e.target.checked)} />}
                  label={<Typography variant="body2">Rural Area (1.0x-2.0x)</Typography>}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Rural Multiplier" type="number"
                  disabled={!isRural} inputProps={{ step: 0.1, min: 1.0, max: 2.0 }}
                  value={ruralMultiplier} onChange={e => setRuralMultiplier(e.target.value)} />
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              2. Immovable Assets & R&R Entitlements
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Tree Valuation (₹)" type="number"
                  value={treeValuation} onChange={e => setTreeValuation(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Structure Valuation (₹)" type="number"
                  value={structureValuation} onChange={e => setStructureValuation(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Checkbox checked={includeSubsistence} onChange={e => setIncludeSubsistence(e.target.checked)} />}
                  label={<Typography variant="caption">Subsistence Grant: ₹36,000 (₹3,000/mo × 12 mos)</Typography>}
                />
                <br />
                <FormControlLabel
                  control={<Checkbox checked={includeResettlement} onChange={e => setIncludeResettlement(e.target.checked)} />}
                  label={<Typography variant="caption">Resettlement Allowance: ₹50,000 (One-time lump sum)</Typography>}
                />
                <br />
                <FormControlLabel
                  control={<Checkbox checked={includeCattleShed} onChange={e => setIncludeCattleShed(e.target.checked)} />}
                  label={<Typography variant="caption">Cattle Shed / Small Trader Grant: ₹25,000</Typography>}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Right: Real-time Calculation Summary & Save Form */}
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#F8FAFC', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5, color: '#0B1F5C' }}>
                Award Calculation Matrix
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>Base Land Value ({areaAcres} Ac × ₹{Number(circleRate).toLocaleString('en-IN')})</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹ {baseLandValue.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>Rural Multiplier Factor ({mult}x)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹ {marketValue.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>Trees & Structural Assets Value</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹ {assetsValue.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.8, color: 'primary.main', fontWeight: 600 }}>
                      Solatium (100% of Market Value - Sec 30)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'primary.main' }}>
                      ₹ {solatium.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontSize: '0.8rem', py: 0.8 }}>R&R Statutory Allowances</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>₹ {totalAllowances.toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0B1F5C' }}>TOTAL STATUTORY AWARD</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1rem', color: '#0B1F5C' }}>
                      ₹ {totalStatutoryAward.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              3. Issue Formal Award Record (Optional)
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Beneficiary Full Name"
                  value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Survey No (e.g. 142/3A)"
                  value={surveyNo} onChange={e => setSurveyNo(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Village / Gram"
                  value={village} onChange={e => setVillage(e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="District"
                  value={district} onChange={e => setDistrict(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" color="primary" fullWidth size="large"
                  onClick={handleCreateAward} disabled={saving}
                  startIcon={<AddCircle />} sx={{ borderRadius: 2, fontWeight: 700 }}>
                  {saving ? 'Creating Award...' : 'Create Official R&R Award'}
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}

// ── Batch Disbursement Modal ────────────────────────────────────────────────
function BatchDisburseDialog({ open, onClose, selectedBeneficiaries, onBatchComplete }) {
  const [mode, setMode] = useState('Direct Benefit Transfer (DBT)');
  const [disburseType, setDisburseType] = useState('full'); // 'full', '50', '25'
  const [submitting, setSubmitting] = useState(false);

  if (!selectedBeneficiaries || selectedBeneficiaries.length === 0) return null;

  const totalPending = selectedBeneficiaries.reduce((s, b) => s + b.pending_amount, 0);

  const calculateAmount = () => {
    if (disburseType === 'full') return totalPending;
    if (disburseType === '50') return Math.round(totalPending * 0.5);
    if (disburseType === '25') return Math.round(totalPending * 0.25);
    return totalPending;
  };

  const handleConfirmBatch = async () => {
    setSubmitting(true);
    try {
      const pct = disburseType === 'full' ? 100 : disburseType === '50' ? 50 : 25;
      const items = selectedBeneficiaries.map(b => ({
        id: b.id,
        amount: Math.round(b.pending_amount * (pct / 100))
      }));
      const res = await fetch(`${API}/batch-disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, mode, percentage: pct })
      });
      const data = await res.json();
      if (res.ok) {
        onBatchComplete(data);
        onClose();
      } else {
        alert(data.error || 'Batch disbursement failed');
      }
    } catch {
      alert('Network error during batch disbursement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontFamily: 'Plus Jakarta Sans', display: 'flex', alignItems: 'center', gap: 1 }}>
        <PlaylistAddCheck color="success" />
        Bulk Compensation Disbursement
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          You have selected <strong>{selectedBeneficiaries.length} beneficiary records</strong> with a combined pending entitlement of <strong>₹ {totalPending.toLocaleString('en-IN')}</strong>.
        </Alert>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Payment Installment</InputLabel>
          <Select value={disburseType} onChange={e => setDisburseType(e.target.value)} label="Payment Installment">
            <MenuItem value="full">100% Full Settlement (Clear entire balance)</MenuItem>
            <MenuItem value="50">50% Statutory 1st Installment (Advance)</MenuItem>
            <MenuItem value="25">25% Interim Mobilization Allowance</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Disbursement Payment Gateway</InputLabel>
          <Select value={mode} onChange={e => setMode(e.target.value)} label="Disbursement Payment Gateway">
            <MenuItem value="Direct Benefit Transfer (DBT)">Direct Benefit Transfer (DBT via PFMS / NPCI)</MenuItem>
            <MenuItem value="RTGS">RTGS Treasury Transfer</MenuItem>
            <MenuItem value="NEFT">NEFT National Clearing</MenuItem>
            <MenuItem value="Demand Draft">State Government Treasury Demand Draft</MenuItem>
          </Select>
        </FormControl>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC' }}>
          <Typography variant="body2" color="text.secondary">Total Batch Payout Amount:</Typography>
          <Typography variant="h5" fontWeight={800} color="success.main" sx={{ mt: 0.5 }}>
            ₹ {calculateAmount().toLocaleString('en-IN')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Funds will be routed directly to validated beneficiary bank accounts via PFMS protocol.
          </Typography>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="success" onClick={handleConfirmBatch}
          disabled={submitting} startIcon={<CheckCircle />} sx={{ borderRadius: 2, fontWeight: 700 }}>
          {submitting ? 'Processing Batch...' : 'Execute Batch DBT Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Beneficiary Detail & Grievance Dialog ───────────────────────────────────
function BeneficiaryDialog({ open, onClose, beneficiary, onDisburse, onStatusChange, onGrievanceFiled, onGrievanceResolved }) {
  const [disburseOpen, setDisburseOpen] = useState(false);
  const [disburseAmount, setDisburseAmount] = useState('');
  const [disburseMode, setDisburseMode] = useState('Direct Benefit Transfer (DBT)');
  const [grievanceOpen, setGrievanceOpen] = useState(false);
  const [grievanceType, setGrievanceType] = useState('Valuation Dispute (Section 64)');
  const [grievanceDesc, setGrievanceDesc] = useState('');
  const [complainantName, setComplainantName] = useState('');
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [additionalAward, setAdditionalAward] = useState(0);

  const b = beneficiary;
  if (!b) return null;

  const progress = b.total_entitlement > 0
    ? Math.round((b.disbursed_amount / b.total_entitlement) * 100) : 0;

  const handleDisburse = () => {
    const amt = Number(disburseAmount);
    if (amt > 0 && amt <= b.pending_amount) {
      onDisburse(b.id, amt, disburseMode);
      setDisburseOpen(false);
      setDisburseAmount('');
    }
  };

  const handleFileGrievance = async () => {
    if (!grievanceDesc.trim()) {
      alert('Please enter grievance description');
      return;
    }
    try {
      const res = await fetch(`${API}/beneficiaries/${b.id}/grievance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: grievanceType,
          description: grievanceDesc,
          complainant_name: complainantName || b.beneficiary_name
        })
      });
      const data = await res.json();
      if (res.ok) {
        onGrievanceFiled(data.beneficiary);
        setGrievanceOpen(false);
        setGrievanceDesc('');
      }
    } catch {
      alert('Failed to file grievance');
    }
  };

  const handleResolveGrievance = async () => {
    try {
      const res = await fetch(`${API}/beneficiaries/${b.id}/grievance-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Resolved',
          remarks: resolveNotes,
          additional_amount: Number(additionalAward)
        })
      });
      const data = await res.json();
      if (res.ok) {
        onGrievanceResolved(data);
        setResolveOpen(false);
      }
    } catch {
      alert('Failed to resolve grievance');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>R&R Compensation Order - ${b.la_case_no}</title>
      <style>
        body { font-family: 'Times New Roman', serif; max-width: 820px; margin: 30px auto; padding: 25px; color: #111; line-height: 1.4; }
        .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px; }
        .header h1 { font-size: 15pt; margin: 4px 0; text-transform: uppercase; }
        .header h2 { font-size: 11pt; margin: 3px 0; font-weight: normal; }
        .badge { display: inline-block; padding: 4px 10px; background: #eee; font-weight: bold; font-size: 9pt; border: 1px solid #999; margin-top: 5px; }
        .section { margin: 15px 0; }
        .section h3 { font-size: 10.5pt; border-bottom: 1px solid #222; padding-bottom: 3px; margin-bottom: 8px; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        td, th { border: 1px solid #777; padding: 6px 9px; text-align: left; font-size: 9.5pt; }
        th { background: #f2f2f2; font-weight: bold; }
        .highlight { background: #fafafa; font-weight: bold; }
        .amount-box { font-size: 13pt; font-weight: bold; text-align: center; padding: 12px; border: 2px solid #000; margin: 18px 0; background: #fcfcfc; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 9pt; }
        .signature-block { width: 30%; text-align: center; border-top: 1px solid #444; padding-top: 5px; }
        .seal { text-align: center; margin-top: 30px; font-size: 8.5pt; color: #555; }
        @media print { body { margin: 0; } }
      </style></head><body>
        <div class="header">
          <h2>भारत सरकार • GOVERNMENT OF INDIA</h2>
          <h2>MINISTRY OF RURAL DEVELOPMENT • DEPT OF LAND RESOURCES</h2>
          <h1>STATUTORY COMPENSATION AWARD ORDER (FORM 7)</h1>
          <h2>Under Section 23 & 30 of the Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 (LARR Act)</h2>
          <div class="badge">CASE NO: ${b.la_case_no}</div>
        </div>

        <div class="section">
          <h3>1. BENEFICIARY & CITIZEN IDENTIFICATION</h3>
          <table>
            <tr><td width="35%"><strong>Beneficiary Name</strong></td><td><strong>${b.beneficiary_name}</strong></td></tr>
            <tr><td><strong>Parentage / Relation</strong></td><td>${b.beneficiary_relation}</td></tr>
            <tr><td><strong>Masked Aadhaar Number</strong></td><td>${b.aadhaar_masked}</td></tr>
            <tr><td><strong>Masked PAN</strong></td><td>${b.pan_masked}</td></tr>
            <tr><td><strong>Bank Account Number</strong></td><td>${b.bank_account} (${b.bank_name})</td></tr>
            <tr><td><strong>IFSC Code</strong></td><td>${b.bank_ifsc}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>2. LAND RECORD & CADASTRAL PARTICULARS</h3>
          <table>
            <tr><td width="35%"><strong>Survey Number</strong></td><td><strong>${b.survey_no}</strong></td></tr>
            <tr><td><strong>Land Parcel Name</strong></td><td>${b.land_name}</td></tr>
            <tr><td><strong>Bhu-Aadhaar (ULPIN)</strong></td><td>${b.ulpin}</td></tr>
            <tr><td><strong>Notified Extent</strong></td><td>${b.area_acres} Acres (${b.area_sqm} Sq.m)</td></tr>
            <tr><td><strong>Classification / Land Use</strong></td><td>${b.land_use}</td></tr>
            <tr><td><strong>Location</strong></td><td>Village: ${b.village}, Taluk: ${b.taluk}, District: ${b.district}, State: ${b.state}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>3. STATUTORY VALUATION & AWARD BREAKDOWN</h3>
          <table>
            <tr><th>Component</th><th>Statutory Provision</th><th>Amount (₹)</th></tr>
            <tr>
              <td>Basic Land Market Value (${b.area_acres} Ac × ₹${b.market_rate_per_acre?.toLocaleString('en-IN')})</td>
              <td>Sec 26 RFCTLARR</td>
              <td>₹ ${b.market_value?.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td>Solatium Award (100% of Market Value)</td>
              <td>Sec 30(1) RFCTLARR</td>
              <td>₹ ${b.solatium_amount?.toLocaleString('en-IN')}</td>
            </tr>
            ${b.additional_benefits?.map(ab => `
              <tr><td>${ab.type}</td><td>Schedule II Mandatory R&R</td><td>₹ ${ab.amount?.toLocaleString('en-IN')}</td></tr>
            `).join('')}
            <tr class="highlight">
              <td colspan="2">TOTAL STATUTORY ENTITLEMENT</td>
              <td>₹ ${b.total_entitlement?.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <div class="amount-box">
          NET PAYABLE COMPENSATION: ₹ ${b.total_entitlement?.toLocaleString('en-IN')}/-
        </div>

        <div class="section">
          <h3>4. PUBLIC PURPOSE & ACQUIRING BODY</h3>
          <table>
            <tr><td width="35%"><strong>Acquisition Purpose</strong></td><td>${b.acquisition_purpose}</td></tr>
            <tr><td><strong>Acquiring Department / SPV</strong></td><td>${b.acquiring_body}</td></tr>
            <tr><td><strong>Sec 11 Preliminary Notification</strong></td><td>${b.notification_date}</td></tr>
            <tr><td><strong>Sec 23 Final Award Declaration</strong></td><td>${b.award_date}</td></tr>
          </table>
        </div>

        <div class="section">
          <h3>5. PFMS DISBURSEMENT LEDGER</h3>
          <table>
            <tr><th>#</th><th>Voucher ID</th><th>Disbursed Date</th><th>Payment Channel</th><th>Amount (₹)</th><th>Status</th></tr>
            ${b.disbursement_history?.map(d => `
              <tr>
                <td>${d.installment}</td>
                <td>${d.voucher_no}</td>
                <td>${d.date}</td>
                <td>${d.mode}</td>
                <td>₹ ${d.amount?.toLocaleString('en-IN')}</td>
                <td>${d.status}</td>
              </tr>
            `).join('')}
            <tr class="highlight">
              <td colspan="4">Total Disbursed to Date / Pending Balance</td>
              <td colspan="2">₹ ${b.disbursed_amount?.toLocaleString('en-IN')} / ₹ ${b.pending_amount?.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <div class="signature-block">
            <strong>Land Acquisition Officer</strong><br/>
            ${b.district} District
          </div>
          <div class="signature-block">
            <strong>Competent Authority (CALA)</strong><br/>
            ${b.state}
          </div>
          <div class="signature-block">
            <strong>Digitally Signed</strong><br/>
            Date: ${new Date().toLocaleDateString('en-IN')}
          </div>
        </div>
        <div class="seal">
          Certified under the Digital India Land Records Modernization Programme (DILRMP). System Generated Document.
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
      <DialogTitle sx={{
        fontWeight: 800, fontFamily: 'Plus Jakarta Sans', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid', borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Gavel color="primary" />
          R&R Compensation & Grievance Dossier
        </Box>
        <Box>
          <Tooltip title="Print Form 7 Compensation Award">
            <IconButton onClick={handlePrint} color="primary"><Print /></IconButton>
          </Tooltip>
          <IconButton onClick={onClose}><Close /></IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Beneficiary Header */}
        <Box sx={{ mb: 2.5, p: 2, bgcolor: '#F0F9FF', borderRadius: 2, border: '1px solid #BAE6FD' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{b.beneficiary_name}</Typography>
              <Typography variant="body2" color="text.secondary">{b.beneficiary_relation}</Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#0369A1' }}>
                Case No: <strong>{b.la_case_no}</strong> • ULPIN: {b.ulpin} • Survey No: {b.survey_no}
              </Typography>
            </Box>
            <Chip label={b.rr_status} color={
              b.rr_status === 'Fully Compensated' ? 'success'
              : b.rr_status === 'Objection Filed' ? 'error'
              : 'warning'
            } sx={{ fontWeight: 700 }} />
          </Box>
        </Box>

        {/* Grievance Banner if Active */}
        {b.grievance_status === 'Objection Pending' && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => setResolveOpen(true)}>
                Review & Resolve
              </Button>
            }>
            <strong>Active Dispute / Objection Registered:</strong> An objection regarding valuation/survey has been filed under Sec 64. Review proceedings before final disbursement.
          </Alert>
        )}

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={700}>Disbursement Completion</Typography>
            <Typography variant="body2" fontWeight={800} color={progress === 100 ? 'success.main' : 'primary.main'}>
              {progress}% Disbursed
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={progress}
            color={progress === 100 ? 'success' : 'primary'}
            sx={{ height: 10, borderRadius: 5 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Disbursed: <strong>₹ {b.disbursed_amount?.toLocaleString('en-IN')}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending: <strong>₹ {b.pending_amount?.toLocaleString('en-IN')}</strong>
            </Typography>
          </Box>
        </Box>

        {/* Compensation Breakdown */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#0B1F5C' }}>
          Statutory Entitlement Breakdown (RFCTLARR 2013)
        </Typography>
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2.5, borderRadius: 2 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell>Market Value ({b.area_acres} Acres × ₹{b.market_rate_per_acre?.toLocaleString('en-IN')}/Acre)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>₹ {b.market_value?.toLocaleString('en-IN')}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Solatium Award (100% Mandatory Solatium as per Sec 30)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>₹ {b.solatium_amount?.toLocaleString('en-IN')}</TableCell>
              </TableRow>
              {b.additional_benefits?.map((ab, i) => (
                <TableRow key={i}>
                  <TableCell>{ab.type}</TableCell>
                  <TableCell align="right">₹ {ab.amount?.toLocaleString('en-IN')}</TableCell>
                </TableRow>
              ))}
              <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                <TableCell sx={{ fontWeight: 800, color: '#0B1F5C' }}>Total Net Entitlement</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0B1F5C' }}>
                  ₹ {b.total_entitlement?.toLocaleString('en-IN')}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Bank & Acquisition Details */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6} sm={4}>
            <Typography variant="caption" color="text.secondary">Acquisition Purpose</Typography>
            <Typography variant="body2" fontWeight={600}>{b.acquisition_purpose}</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant="caption" color="text.secondary">Acquiring Body</Typography>
            <Typography variant="body2" fontWeight={600}>{b.acquiring_body}</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant="caption" color="text.secondary">Disbursement Mode</Typography>
            <Typography variant="body2" fontWeight={600}>{b.disbursement_mode}</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant="caption" color="text.secondary">Bank Account</Typography>
            <Typography variant="body2">{b.bank_account} ({b.bank_name})</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant="caption" color="text.secondary">IFSC Code</Typography>
            <Typography variant="body2">{b.bank_ifsc}</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant="caption" color="text.secondary">Location</Typography>
            <Typography variant="body2">{b.village}, {b.district}, {b.state}</Typography>
          </Grid>
        </Grid>

        {/* Disbursement Ledger */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#0B1F5C' }}>
          PFMS Disbursement History ({b.disbursement_history?.length || 0} Transactions)
        </Typography>
        {b.disbursement_history?.length > 0 ? (
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Channel</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>PFMS Voucher No</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {b.disbursement_history.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell>{d.installment}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>₹ {d.amount?.toLocaleString('en-IN')}</TableCell>
                    <TableCell>{d.date}</TableCell>
                    <TableCell><Chip size="small" label={d.mode} variant="outlined" /></TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{d.voucher_no}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            No disbursements recorded yet. Click below to execute first installment.
          </Typography>
        )}

        {/* Rehabilitation Package */}
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#0B1F5C' }}>
          Rehabilitation & Resettlement Package (Schedule II)
        </Typography>
        <List dense sx={{ mb: 2 }}>
          {b.rehabilitation_package?.map((pkg, i) => (
            <ListItem key={i} sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, mb: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {pkg.status === 'Allotted' || pkg.status === 'Placed' || pkg.status === 'Active' || pkg.status === 'Completed' || pkg.status === 'Approved'
                  ? <CheckCircle fontSize="small" color="success" />
                  : <HourglassEmpty fontSize="small" color="warning" />}
              </ListItemIcon>
              <ListItemText
                primary={<Typography variant="body2" fontWeight={600}>{pkg.benefit}</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">Status: {pkg.status}</Typography>}
              />
            </ListItem>
          ))}
        </List>

        {/* Actions: Disburse or Raise Objection */}
        <Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={2}>
          {b.pending_amount > 0 && !disburseOpen && (
            <Button variant="contained" color="success" size="large" fullWidth
              startIcon={<AccountBalanceWallet />} onClick={() => setDisburseOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 700 }}>
              Process Disbursement (₹ {b.pending_amount?.toLocaleString('en-IN')} Pending)
            </Button>
          )}

          {b.grievance_status !== 'Objection Pending' && !grievanceOpen && (
            <Button variant="outlined" color="warning" size="large"
              startIcon={<ReportProblem />} onClick={() => setGrievanceOpen(true)}
              sx={{ borderRadius: 2, minWidth: 200 }}>
              File Objection (Sec 64)
            </Button>
          )}
        </Stack>

        {/* Disburse Sub-panel */}
        {disburseOpen && (
          <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 2, bgcolor: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <Typography variant="subtitle2" fontWeight={800} color="success.dark" sx={{ mb: 2 }}>
              Execute DBT Payment to Beneficiary Account
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth label="Amount (₹)" type="number"
                  value={disburseAmount} onChange={e => setDisburseAmount(e.target.value)}
                  helperText={`Max: ₹ ${b.pending_amount?.toLocaleString('en-IN')}`}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Payment Mode</InputLabel>
                  <Select value={disburseMode} onChange={e => setDisburseMode(e.target.value)} label="Payment Mode">
                    <MenuItem value="Direct Benefit Transfer (DBT)">Direct Benefit Transfer (DBT/PFMS)</MenuItem>
                    <MenuItem value="RTGS">RTGS Treasury Transfer</MenuItem>
                    <MenuItem value="NEFT">NEFT Direct</MenuItem>
                    <MenuItem value="Demand Draft">Demand Draft</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button variant="contained" color="success" onClick={handleDisburse}
                disabled={!disburseAmount || Number(disburseAmount) <= 0 || Number(disburseAmount) > b.pending_amount}
                startIcon={<CheckCircle />} sx={{ borderRadius: 2 }}>
                Confirm & Disburse Now
              </Button>
              <Button variant="outlined" onClick={() => setDisburseOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            </Box>
          </Paper>
        )}

        {/* Grievance Sub-panel */}
        {grievanceOpen && (
          <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 2, bgcolor: '#FFFBEB', borderColor: '#FDE68A' }}>
            <Typography variant="subtitle2" fontWeight={800} color="warning.dark" sx={{ mb: 2 }}>
              File Land Acquisition Objection / Grievance (Section 64)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Objection Type</InputLabel>
                  <Select value={grievanceType} onChange={e => setGrievanceType(e.target.value)} label="Objection Type">
                    <MenuItem value="Valuation Dispute (Section 64)">Valuation Dispute (Rate per Acre)</MenuItem>
                    <MenuItem value="Area Measurement Discrepancy">Area Measurement Discrepancy</MenuItem>
                    <MenuItem value="Omission of Tree / Structure Assets">Omission of Tree / Structure Assets</MenuItem>
                    <MenuItem value="Title & Succession Claim Dispute">Title & Succession Claim Dispute</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Complainant / Advocate Name"
                  value={complainantName} onChange={e => setComplainantName(e.target.value)}
                  placeholder={b.beneficiary_name} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} size="small" label="Objection Grounds & Facts"
                  value={grievanceDesc} onChange={e => setGrievanceDesc(e.target.value)}
                  placeholder="Detail grounds for objection, claim amount, or surveyor discrepancy..." />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button variant="contained" color="warning" onClick={handleFileGrievance} sx={{ borderRadius: 2 }}>
                Submit Official Objection
              </Button>
              <Button variant="outlined" onClick={() => setGrievanceOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            </Box>
          </Paper>
        )}

        {/* Resolve Grievance Sub-panel */}
        {resolveOpen && (
          <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 2, bgcolor: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <Typography variant="subtitle2" fontWeight={800} color="success.dark" sx={{ mb: 2 }}>
              Adjudicate & Settle Objection
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Additional Award Revision (₹)" type="number"
                  value={additionalAward} onChange={e => setAdditionalAward(e.target.value)}
                  helperText="Enter additional compensation granted by Authority, if any" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} size="small" label="Resolution Order Notes"
                  value={resolveNotes} onChange={e => setResolveNotes(e.target.value)}
                  placeholder="Details of hearing, joint re-measurement, or amicable compromise..." />
              </Grid>
            </Grid>
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button variant="contained" color="success" onClick={handleResolveGrievance} sx={{ borderRadius: 2 }}>
                Confirm Resolution Order
              </Button>
              <Button variant="outlined" onClick={() => setResolveOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
            </Box>
          </Paper>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main R&R Compensation Page ──────────────────────────────────────────────
const RRTracker = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [tab, setTab] = useState(0);
  const [statuses, setStatuses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const states = ['All', 'Karnataka', 'Maharashtra', 'Tamil Nadu', 'Rajasthan', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Punjab'];

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (stateFilter !== 'All') params.set('state', stateFilter);
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`${API}/beneficiaries?${params}`);
      const data = await res.json();
      setBeneficiaries(data.beneficiaries || []);
      setStats(data.stats || {});
      setStatuses(data.statuses || []);
    } catch (err) {
      console.error('R&R fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [stateFilter, statusFilter, searchTerm]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    const handler = (data) => {
      if (data.beneficiary) {
        setBeneficiaries(prev => {
          const exists = prev.find(b => b.id === data.beneficiary.id);
          if (exists) return prev.map(b => b.id === data.beneficiary.id ? data.beneficiary : b);
          return [data.beneficiary, ...prev];
        });
        if (selectedBeneficiary?.id === data.beneficiary.id) {
          setSelectedBeneficiary(data.beneficiary);
        }
      } else if (data.batch) {
        fetchData();
      }
    };
    socket.on('rr_updated', handler);
    return () => socket.off('rr_updated', handler);
  }, [selectedBeneficiary, fetchData]);

  const handleDisburse = async (beneficiaryId, amount, mode) => {
    try {
      const res = await fetch(`${API}/beneficiaries/${beneficiaryId}/disburse`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, mode })
      });
      const updated = await res.json();
      if (res.ok) {
        setBeneficiaries(prev => prev.map(b => b.id === updated.id ? updated : b));
        setSelectedBeneficiary(updated);
        setSnack({ open: true, message: `₹ ${amount.toLocaleString('en-IN')} disbursed successfully to ${updated.beneficiary_name}`, severity: 'success' });
        fetchData(); // refresh stats
      } else {
        setSnack({ open: true, message: updated.error || 'Disbursement failed', severity: 'error' });
      }
    } catch {
      setSnack({ open: true, message: 'Network error during disbursement', severity: 'error' });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredByTab.map(b => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Beneficiary Name', 'Survey No', 'ULPIN', 'State', 'District', 'Land Use', 'Area (Acres)', 'Total Entitlement (INR)', 'Disbursed (INR)', 'Pending (INR)', 'R&R Status', 'Bank A/C', 'Bank Name', 'LA Case No'];
    const rows = filteredByTab.map(b => [
      b.id, `"${b.beneficiary_name}"`, b.survey_no, b.ulpin, b.state, b.district,
      `"${b.land_use}"`, b.area_acres, b.total_entitlement, b.disbursed_amount,
      b.pending_amount, `"${b.rr_status}"`, `"${b.bank_account}"`, `"${b.bank_name}"`, b.la_case_no
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RR_Compensation_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDetail = (b) => {
    setSelectedBeneficiary(b);
    setDialogOpen(true);
  };

  const getStatusColor = (status) => {
    if (status === 'Fully Compensated' || status === 'R&R Benefits Delivered') return 'success';
    if (status === 'Partial Disbursement' || status === 'Compensation Offered') return 'info';
    if (status === 'Objection Filed' || status === 'Referred to LARR Authority') return 'error';
    if (status === 'Award Declared (Sec 23)' || status === 'Market Value Assessed') return 'warning';
    return 'default';
  };

  // Tab-based filtering
  const filteredByTab = tab === 0 ? beneficiaries
    : tab === 1 ? beneficiaries.filter(b => b.pending_amount > 0)
    : tab === 2 ? beneficiaries.filter(b => b.rr_status === 'Fully Compensated')
    : tab === 3 ? beneficiaries.filter(b => b.grievance_status === 'Objection Pending' || b.rr_status === 'Objection Filed')
    : beneficiaries;

  const formatCurrency = (n) => `₹ ${(n || 0).toLocaleString('en-IN')}`;
  const selectedBeneficiariesList = beneficiaries.filter(b => selectedIds.includes(b.id));

  return (
    <Box>
      {/* Header with Title and Action Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Plus Jakarta Sans', color: '#0B1F5C' }}>
            R&R Compensation Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Statutory land acquisition compensation, DBT disbursements & Rehabilitation & Resettlement tracking under RFCTLARR Act 2013
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button variant="outlined" color="primary" startIcon={<Download />} onClick={handleExportCSV}
            sx={{ borderRadius: 2, fontWeight: 600 }}>
            Export CSV
          </Button>
          <Button variant="contained" color="secondary" startIcon={<Calculate />} onClick={() => setCalcOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#0B1F5C', '&:hover': { bgcolor: '#081745' } }}>
            LARR Calculator & New Award
          </Button>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchData} color="primary" sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Assessment />} label="Total Beneficiaries" value={stats.total_beneficiaries || 0}
            color="primary" sub={`Across ${Object.keys(stats.by_state || {}).length} states`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<CurrencyRupee />} label="Total Entitlement"
            value={formatCurrency(stats.total_entitlement)} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<TrendingUp />} label="Total Disbursed"
            value={formatCurrency(stats.total_disbursed)} color="success"
            sub={`${stats.total_entitlement ? Math.round((stats.total_disbursed / stats.total_entitlement) * 100) : 0}% disbursed`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PendingActions />} label="Pending Disbursement"
            value={formatCurrency(stats.total_pending)} color="warning"
            sub={`${stats.grievances_open || 0} active grievances`} />
        </Grid>
      </Grid>

      {/* Bulk Action Toolbar if items selected */}
      {selectedIds.length > 0 && (
        <Paper elevation={2} sx={{
          p: 1.5, mb: 2, borderRadius: 2, bgcolor: '#0B1F5C', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircle sx={{ color: '#10B981' }} />
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {selectedIds.length} beneficiary records selected
            </Typography>
            <Typography variant="caption" sx={{ color: '#93C5FD' }}>
              (Pending Balance: ₹ {selectedBeneficiariesList.reduce((s, b) => s + b.pending_amount, 0).toLocaleString('en-IN')})
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="contained" color="success"
              startIcon={<AccountBalanceWallet />} onClick={() => setBatchOpen(true)}
              sx={{ fontWeight: 700 }}>
              Batch DBT Disburse
            </Button>
            <Button size="small" sx={{ color: 'white' }} onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Filters */}
      <Card sx={{ mb: 2, p: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterList color="action" />
          <TextField
            size="small" placeholder="Search by beneficiary name, survey no, ULPIN, case no..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ minWidth: 320, flex: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>State</InputLabel>
            <Select value={stateFilter} onChange={e => setStateFilter(e.target.value)} label="State">
              {states.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>R&R Status</InputLabel>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} label="R&R Status">
              <MenuItem value="All">All Statuses</MenuItem>
              {statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`All Beneficiaries (${beneficiaries.length})`} />
        <Tab label={`Pending Disbursements (${beneficiaries.filter(b => b.pending_amount > 0).length})`} />
        <Tab label={`Fully Compensated (${beneficiaries.filter(b => b.rr_status === 'Fully Compensated').length})`} />
        <Tab label={`Grievances & Disputes (${beneficiaries.filter(b => b.grievance_status === 'Objection Pending' || b.rr_status === 'Objection Filed').length})`} />
        <Tab label="Statutory Guidelines (RFCTLARR 2013)" />
      </Tabs>

      {/* TAB 0-3: Beneficiary Table */}
      {tab <= 3 && (
        <Card sx={{ borderRadius: 3 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selectedIds.length > 0 && selectedIds.length < filteredByTab.length}
                      checked={filteredByTab.length > 0 && selectedIds.length === filteredByTab.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Beneficiary</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Survey / ULPIN</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>State</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Land Use</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Total Entitlement</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Disbursed</TableCell>
                  <TableCell sx={{ fontWeight: 800, width: '13%' }}>Disbursement %</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredByTab.map((b) => {
                  const progress = b.total_entitlement > 0
                    ? Math.round((b.disbursed_amount / b.total_entitlement) * 100) : 0;
                  const isSelected = selectedIds.includes(b.id);
                  return (
                    <TableRow key={b.id} hover selected={isSelected} sx={{ cursor: 'pointer' }}
                      onClick={() => openDetail(b)}>
                      <TableCell padding="checkbox" onClick={e => handleSelectRow(b.id, e)}>
                        <Checkbox checked={isSelected} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{b.beneficiary_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.beneficiary_relation}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>{b.survey_no}</Typography>
                        <Typography variant="caption" color="text.secondary">{b.ulpin}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={b.state_code} variant="outlined" sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{b.land_use}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{b.area_acres} Ac</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(b.total_entitlement)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={progress === 100 ? 'success.main' : 'text.primary'} fontWeight={600}>
                          {formatCurrency(b.disbursed_amount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress variant="determinate" value={progress}
                              color={progress === 100 ? 'success' : progress > 50 ? 'info' : 'warning'}
                              sx={{ height: 6, borderRadius: 3 }} />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32, fontWeight: 700 }}>
                            {progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={b.rr_status}
                          color={getStatusColor(b.rr_status)} sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="View Full Dossier & Disburse">
                            <IconButton size="small" color="primary" onClick={() => openDetail(b)}>
                              <ArrowForward fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print Form 7 Compensation Order">
                            <IconButton size="small" onClick={() => {
                              setSelectedBeneficiary(b);
                              setDialogOpen(true);
                            }}>
                              <Print fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredByTab.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {loading ? 'Loading R&R beneficiary data...' : 'No beneficiaries match your current search or tab filters.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 4: Statutory LARR 2013 Policy Information */}
      {tab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1, color: '#0B1F5C' }}>
                Key Provisions of RFCTLARR Act 2013
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                The Right to Fair Compensation and Transparency in Land Acquisition, Rehabilitation and Resettlement Act, 2013 mandates comprehensive, legally binding compensation formulas.
              </Typography>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2" fontWeight={700}>Section 26: Determination of Market Value</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Market value is assessed as the highest of: (a) minimum circle rate fixed by state stamp authorities, (b) average sale deed price of highest 50% transactions in surrounding area, or (c) mutually agreed consent rate.
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2" fontWeight={700}>First Schedule: Rural Multiplier (1.00x to 2.00x)</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    For rural lands situated away from urban boundaries, the base market value is multiplied by a state-notified factor between 1.00 and 2.00 times depending on proximity to nearest municipal limit.
                  </Typography>
                </AccordionDetails>
              </Accordion>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2" fontWeight={700}>Section 30: 100% Mandatory Solatium</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary">
                    Collector must impose a "Solatium" equal to 100% of total market value (land + trees + buildings) as compensation for compulsory nature of acquisition.
                  </Typography>
                </AccordionDetails>
              </Accordion>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1, color: '#0B1F5C' }}>
                Schedule II: Mandatory Rehabilitation Package
              </Typography>
              <List>
                {[
                  ['Housing / Plot Allotment', 'Rural: minimum 50 sq.m house in Indira Awas Yojana / PMAY pattern or ₹1.5L. Urban: min 50 sq.m flat.'],
                  ['Subsistence Allowance', 'Monthly grant of ₹3,000 for 12 continuous months (total ₹36,000) for displaced families.'],
                  ['Transportation & Resettlement Grant', 'One-time lump sum payment of ₹50,000 per displaced family for shifting.'],
                  ['Cattle Shed / Petty Shop Grant', 'One-time grant of ₹25,000 for families owning livestock or small commercial kiosks.'],
                  ['Stamp Duty Exemption', 'Complete exemption or direct reimbursement of stamp duty & registration fees for alternative land purchased.'],
                  ['Employment or Annuity', 'Mandatory employment for one family member or one-time lump sum of ₹5,00,000 or 20-year monthly annuity.']
                ].map(([title, desc], i) => (
                  <ListItem key={i} sx={{ px: 0, py: 1, borderBottom: '1px solid #F1F5F9' }}>
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={700}>{title}</Typography>}
                      secondary={<Typography variant="caption" color="text.secondary">{desc}</Typography>}
                    />
                  </ListItem>
                ))}
              </List>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Detail Dialog */}
      <BeneficiaryDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        beneficiary={selectedBeneficiary}
        onDisburse={handleDisburse}
        onGrievanceFiled={(updated) => {
          setBeneficiaries(prev => prev.map(b => b.id === updated.id ? updated : b));
          setSelectedBeneficiary(updated);
          setSnack({ open: true, message: 'Objection registered successfully under Section 64', severity: 'warning' });
          fetchData();
        }}
        onGrievanceResolved={(updated) => {
          setBeneficiaries(prev => prev.map(b => b.id === updated.id ? updated : b));
          setSelectedBeneficiary(updated);
          setSnack({ open: true, message: 'Grievance resolved and award updated successfully', severity: 'success' });
          fetchData();
        }}
      />

      {/* Statutory Calculator Dialog */}
      <StatutoryCalculatorDialog
        open={calcOpen}
        onClose={() => setCalcOpen(false)}
        onAwardCreated={(newAward) => {
          setBeneficiaries(prev => [newAward, ...prev]);
          setSnack({ open: true, message: `New statutory award created for ${newAward.beneficiary_name}!`, severity: 'success' });
          fetchData();
        }}
      />

      {/* Batch Disbursement Dialog */}
      <BatchDisburseDialog
        open={batchOpen}
        onClose={() => setBatchOpen(false)}
        selectedBeneficiaries={selectedBeneficiariesList}
        onBatchComplete={(res) => {
          setSnack({ open: true, message: `Batch payment of ₹ ${res.total_disbursed?.toLocaleString('en-IN')} disbursed to ${res.processed_count} beneficiaries!`, severity: 'success' });
          setSelectedIds([]);
          fetchData();
        }}
      />

      {/* Snackbar Notifications */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ borderRadius: 2 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RRTracker;
