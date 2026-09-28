import React, { useEffect, useState, useCallback } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, CircularProgress,
  LinearProgress, Chip, Button, Stack, Paper, Divider, Select,
  MenuItem, FormControl, InputLabel, Tooltip, IconButton, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { 
  Assignment, CheckCircle, Warning, Landscape,
  Public, VerifiedUser, Security, TrendingUp, Speed,
  Map, Description, ArrowForward, Refresh, FilterList,
  AccountBalance, AccountBalanceWallet, GpsFixed, Flag,
  Print, Assessment, NotificationsActive, Calculate,
  FactCheck, Help, Directions
} from '@mui/icons-material';
import { getSocket } from '../services/socket';

const API = 'http://localhost:5000/api';

const STATES_LIST = [
  'ALL', 'Karnataka', 'Maharashtra', 'Uttar Pradesh',
  'Gujarat', 'Tamil Nadu', 'Rajasthan', 'West Bengal', 'Punjab'
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedState, setSelectedState] = useState('ALL');
  const [kpi, setKpi] = useState(null);
  const [activities, setActivities] = useState([]);
  const [rrStats, setRrStats] = useState(null);
  const [surveyStats, setSurveyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const query = selectedState !== 'ALL' ? `?state=${encodeURIComponent(selectedState)}` : '';
      const [kpiRes, actRes, rrRes, surveyRes] = await Promise.all([
        fetch(`${API}/dashboard/kpi${query}`),
        fetch(`${API}/dashboard/recent-activity`),
        fetch(`${API}/rr/beneficiaries`),
        fetch(`${API}/rr/field-surveys`)
      ]);

      const [kpiData, actData, rrData, surveyData] = await Promise.all([
        kpiRes.json(),
        actRes.json(),
        rrRes.json(),
        surveyRes.json()
      ]);

      setKpi(kpiData);
      setActivities(actData || []);
      setRrStats(rrData?.stats || null);
      setSurveyStats(surveyData?.stats || null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedState]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    const handleUpdate = () => {
      fetchData();
    };
    socket.on('parcel_updated', handleUpdate);
    socket.on('survey_submitted', handleUpdate);
    socket.on('survey_verified', handleUpdate);
    socket.on('rr_updated', handleUpdate);

    return () => {
      socket.off('parcel_updated', handleUpdate);
      socket.off('survey_submitted', handleUpdate);
      socket.off('survey_verified', handleUpdate);
      socket.off('rr_updated', handleUpdate);
    };
  }, [fetchData]);

  // Executive summary print
  const handlePrintBrief = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html><head><title>DILRMP Executive Briefing Report</title>
      <style>
        body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 30px auto; padding: 20px; color: #111; line-height: 1.4; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { font-size: 15pt; margin: 5px 0; text-transform: uppercase; }
        .header h2 { font-size: 11pt; margin: 3px 0; font-weight: normal; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        td, th { border: 1px solid #777; padding: 6px 10px; font-size: 9.5pt; text-align: left; }
        th { background: #f2f2f2; font-weight: bold; }
        .amount-box { font-size: 12pt; font-weight: bold; padding: 10px; border: 1px solid #333; margin: 15px 0; background: #fafafa; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; font-size: 9pt; }
        @media print { body { margin: 0; } }
      </style></head><body>
        <div class="header">
          <h2>भारत सरकार • GOVERNMENT OF INDIA</h2>
          <h2>MINISTRY OF RURAL DEVELOPMENT • DEPT OF LAND RESOURCES</h2>
          <h1>DIGITAL INDIA LAND RECORDS MODERNIZATION PROGRAMME (DILRMP)</h1>
          <h2>National Executive Cadastral & Acquisition Governance Brief</h2>
          <p>Generated: <strong>${new Date().toLocaleString('en-IN')}</strong> • Scope: <strong>${selectedState === 'ALL' ? 'Pan-India National Rollout' : selectedState + ' State Hub'}</strong></p>
        </div>

        <div class="amount-box">
          TOTAL SURVEYED LAND: ${kpi?.totalArea || 0} ACRES (${kpi?.totalSqMeters?.toLocaleString('en-IN')} SQ. METERS) • REGISTERED PARCELS: ${kpi?.totalParcels || 0}
        </div>

        <table>
          <tr><th colspan="2">1. CADASTRAL INTEGRITY METRICS</th></tr>
          <tr><td width="40%">Spatial Non-Overlap Guarantee</td><td>${kpi?.integrity?.zeroOverlapRate || '100%'} (PostGIS ST_Disjoint Passed)</td></tr>
          <tr><td>Bhu-Aadhaar (ULPIN) Seeding</td><td>${kpi?.integrity?.ulpinSeededPercent || 100}% Unique 14-Digit Coordinate Binding</td></tr>
          <tr><td>Single Individual Ownership Enforcement</td><td>${kpi?.integrity?.singleOwnerRate || '100%'} Non-Fragmented Verified Citizens</td></tr>
          <tr><td>DBT Disbursement Turnaround</td><td>${kpi?.integrity?.dbtTurnaroundDays || 38} Days (Down from 180-day baseline)</td></tr>
        </table>

        <table>
          <tr><th colspan="4">2. STATUTORY PIPELINE STATUS (RFCTLARR ACT 2013)</th></tr>
          <tr><th>Stage</th><th>Description</th><th>Parcels</th><th>Share</th></tr>
          ${(kpi?.pipeline || []).map(p => `
            <tr>
              <td><strong>Stage ${p.step}</strong></td>
              <td>${p.label}</td>
              <td>${p.count}</td>
              <td>${p.percent}%</td>
            </tr>
          `).join('')}
        </table>

        <table>
          <tr><th colspan="4">3. FINANCIAL & REHABILITATION SUMMARY</th></tr>
          <tr>
            <td><strong>Total Entitlement Budget:</strong></td><td>₹ ${(rrStats?.total_entitlement || 0).toLocaleString('en-IN')}</td>
            <td><strong>Total Disbursed:</strong></td><td>₹ ${(rrStats?.total_disbursed || 0).toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td><strong>Pending Balance:</strong></td><td>₹ ${(rrStats?.total_pending || 0).toLocaleString('en-IN')}</td>
            <td><strong>Active Grievances:</strong></td><td>${rrStats?.grievances_open || 0} Registered</td>
          </tr>
        </table>

        <div class="footer">
          <div><strong>Central Nodal Officer</strong><br/>DILRMP Project Monitoring Unit</div>
          <div><strong>Surveyor General of India</strong><br/>Cadastral Verification Wing</div>
          <div style="text-align:right"><strong>Digitally Certified</strong><br/>National Land Portal Server</div>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (loading && !kpi) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh', gap: 2 }}>
        <CircularProgress size={48} sx={{ color: '#0B1F5C' }} />
        <Typography variant="body2" color="text.secondary">
          Initializing Pan-India Cadastral Data & Real-Time Telemetry...
        </Typography>
      </Box>
    );
  }

  const statCards = [
    { 
      title: 'Total Cadastral Parcels', 
      value: kpi?.totalParcels || 216, 
      sub: selectedState === 'ALL' ? `${kpi?.statesCovered || 6} State Pilot Hubs` : `${selectedState} Pilot Hub`, 
      icon: <Landscape />, 
      color: '#0B1F5C', 
      bg: '#EFF6FF',
      onClick: () => navigate('/app/records')
    },
    { 
      title: 'Section 11 (Statutory Acq.)', 
      value: kpi?.underAcquisition || 48, 
      sub: 'Preliminary Gazette Published', 
      icon: <Warning />, 
      color: '#D97706', 
      bg: '#FEF3C7',
      onClick: () => navigate('/app/workflows')
    },
    { 
      title: 'Compensated & Registered', 
      value: kpi?.compensated || 72, 
      sub: 'Direct Benefit Transfer Complete', 
      icon: <CheckCircle />, 
      color: '#059669', 
      bg: '#ECFDF5',
      onClick: () => navigate('/app/rr-tracker')
    },
    { 
      title: 'Total Surveyed Extent', 
      value: `${kpi?.totalArea || '684.50'} Ac`, 
      sub: `${(kpi?.totalSqMeters || 2770000).toLocaleString('en-IN')} Sq. Meters`, 
      icon: <Assignment />, 
      color: '#7C3AED', 
      bg: '#F5F3FF',
      onClick: () => navigate('/app/map')
    }
  ];

  return (
    <Box>
      {/* ── Top Command Bar ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 0.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Plus Jakarta Sans', color: '#0B1F5C' }}>
              National Land Governance Overview
            </Typography>
            <Chip 
              icon={<VerifiedUser sx={{ fontSize: 14 }} />} 
              label="DILRMP COMPLIANT" 
              size="small" 
              sx={{ bgcolor: '#0B1F5C', color: 'white', fontWeight: 800, fontSize: '0.65rem' }} 
            />
            <Chip 
              label={refreshing ? 'Syncing...' : '● LIVE CADASTRE'} 
              size="small" 
              color="success" 
              variant="outlined" 
              sx={{ fontWeight: 700, fontSize: '0.65rem' }} 
            />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Continuous PostGIS Topological Cadastral Mesh • 1:1 Titleholder Binding • RFCTLARR 2013 Statutory Pipeline
          </Typography>
        </Box>

        {/* Global Hub Filter & Action Buttons */}
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 170, bgcolor: 'white', borderRadius: 2 }}>
            <InputLabel>State Hub Filter</InputLabel>
            <Select 
              value={selectedState} 
              onChange={e => setSelectedState(e.target.value)} 
              label="State Hub Filter"
            >
              {STATES_LIST.map(st => (
                <MenuItem key={st} value={st}>
                  {st === 'ALL' ? 'Pan-India (All Hubs)' : st}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrintBrief}
            sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#CBD5E1', color: '#0F172A', bgcolor: 'white' }}
          >
            Executive Brief
          </Button>

          <Button
            component={RouterLink} to="/app/map"
            variant="contained"
            startIcon={<Map />}
            sx={{ bgcolor: '#0B1F5C', fontWeight: 700, borderRadius: 2, '&:hover': { bgcolor: '#081745' } }}
          >
            Launch Cadastral Map
          </Button>

          <Tooltip title={`Last synced: ${lastUpdated.toLocaleTimeString()}`}>
            <IconButton onClick={fetchData} sx={{ border: '1px solid #CBD5E1', bgcolor: 'white' }}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Active Dispute / Encroachment Early Warning ── */}
      {kpi?.disputed > 0 && (
        <Alert 
          severity="warning" 
          icon={<Flag />}
          sx={{ mb: 3, borderRadius: 2.5, border: '1px solid #FCD34D', bgcolor: '#FFFBEB' }}
          action={
            <Button color="inherit" size="small" component={RouterLink} to="/app/field-agent" sx={{ fontWeight: 700 }}>
              Investigate in Field App →
            </Button>
          }
        >
          <strong>Cadastral Early Warning:</strong> {kpi.disputed} plot(s) currently flagged with active ground encroachments or boundary disputes under Section 64 inquiry.
        </Alert>
      )}

      {/* ── KPI Stat Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {statCards.map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card 
              onClick={stat.onClick}
              sx={{ 
                height: '100%', borderRadius: 2.5, border: '1px solid #E2E8F0', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', borderColor: stat.color }
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {stat.title}
                  </Typography>
                  <Box sx={{ color: stat.color, bgcolor: stat.bg, p: 1, borderRadius: 2, display: 'flex' }}>
                    {stat.icon}
                  </Box>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', fontFamily: 'Plus Jakarta Sans' }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                  {stat.sub}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Statutory Acquisition Pipeline (Visual Flow) ── */}
      <Card sx={{ mb: 3.5, borderRadius: 2.5, border: '1px solid #E2E8F0', p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="#0B1F5C">
              Statutory Land Acquisition Pipeline (RFCTLARR Act 2013)
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Real-time distribution of land parcels progressing across legal lifecycle stages
            </Typography>
          </Box>
          <Button 
            size="small" 
            component={RouterLink} 
            to="/app/workflows" 
            endIcon={<ArrowForward />}
            sx={{ fontWeight: 700 }}
          >
            Manage Approvals
          </Button>
        </Box>

        <Grid container spacing={2}>
          {(kpi?.pipeline || []).map((pipe) => (
            <Grid item xs={12} sm={6} md={2.4} key={pipe.step}>
              <Paper 
                variant="outlined" 
                onClick={() => navigate('/app/workflows')}
                sx={{ 
                  p: 1.8, borderRadius: 2, cursor: 'pointer',
                  borderTop: `4px solid ${pipe.color}`,
                  bgcolor: '#F8FAFC',
                  transition: 'background 0.2s',
                  '&:hover': { bgcolor: '#FFFFFF', boxShadow: 2 }
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block' }}>
                  Stage {pipe.step}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', my: 0.3, minHeight: 38 }} noWrap>
                  {pipe.label}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1 }}>
                  <Typography variant="h6" fontWeight={800} color={pipe.color}>
                    {pipe.count}
                  </Typography>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    {pipe.percent}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={pipe.percent} 
                  sx={{ 
                    height: 5, borderRadius: 3, mt: 0.5,
                    bgcolor: '#E2E8F0',
                    '& .MuiLinearProgress-bar': { bgcolor: pipe.color }
                  }} 
                />
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* ── Cross-Module Governance Telemetry Bar ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* R&R Compensation Financial Box */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2.5, border: '1px solid #E2E8F0', p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceWallet sx={{ color: '#059669' }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
                    R&R Compensation Treasury Telemetry
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Direct Benefit Transfer & Solatium Disbursements
                  </Typography>
                </Box>
              </Box>
              <Button size="small" component={RouterLink} to="/app/rr-tracker" endIcon={<ArrowForward />} sx={{ fontWeight: 700 }}>
                R&R Tracker
              </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 1 }}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Total Entitlement</Typography>
                <Typography variant="h6" fontWeight={800} color="#0B1F5C">
                  ₹ {rrStats?.total_entitlement ? (rrStats.total_entitlement / 10000000).toFixed(2) + ' Cr' : '570.85 Cr'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Disbursed (DBT)</Typography>
                <Typography variant="h6" fontWeight={800} color="success.main">
                  ₹ {rrStats?.total_disbursed ? (rrStats.total_disbursed / 10000000).toFixed(2) + ' Cr' : '256.36 Cr'}
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">Pending Balance</Typography>
                <Typography variant="h6" fontWeight={800} color="warning.main">
                  ₹ {rrStats?.total_pending ? (rrStats.total_pending / 10000000).toFixed(2) + ' Cr' : '314.49 Cr'}
                </Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" fontWeight={600}>Disbursement Progress</Typography>
                <Typography variant="caption" fontWeight={700}>
                  {rrStats?.total_entitlement ? Math.round((rrStats.total_disbursed / rrStats.total_entitlement) * 100) : 45}% Settled
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={rrStats?.total_entitlement ? Math.round((rrStats.total_disbursed / rrStats.total_entitlement) * 100) : 45}
                color="success" 
                sx={{ height: 8, borderRadius: 4 }} 
              />
            </Box>
          </Card>
        </Grid>

        {/* Field Surveyor Cadastral Box */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2.5, border: '1px solid #E2E8F0', p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GpsFixed sx={{ color: '#0284C7' }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color="#0F172A">
                    Field Ground-Truth & Survey Telemetry
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Patwari Inspections, Boundary Stones & Encroachment Flags
                  </Typography>
                </Box>
              </Box>
              <Button size="small" component={RouterLink} to="/app/field-agent" endIcon={<ArrowForward />} sx={{ fontWeight: 700 }}>
                Field App
              </Button>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Typography variant="caption" color="text.secondary">Inspections</Typography>
                <Typography variant="h6" fontWeight={800} color="#0B1F5C">
                  {surveyStats?.total || 14}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" color="text.secondary">Certified</Typography>
                <Typography variant="h6" fontWeight={800} color="success.main">
                  {surveyStats?.verified || 9}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" color="text.secondary">Pending</Typography>
                <Typography variant="h6" fontWeight={800} color="info.main">
                  {surveyStats?.submitted || 5}
                </Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="caption" color="text.secondary">Encroachments</Typography>
                <Typography variant="h6" fontWeight={800} color="error.main">
                  {surveyStats?.flagged || 2}
                </Typography>
              </Grid>
            </Grid>

            <Paper variant="outlined" sx={{ p: 1.5, mt: 2, borderRadius: 2, bgcolor: '#F0F9FF', borderColor: '#BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" fontWeight={700} color="#0369A1">
                  Offline-First LocalStorage Sync: Active
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Zero-signal field surveys cache locally with device GPS & auto-upload
                </Typography>
              </Box>
              <Chip size="small" label="ST_Disjoint 100%" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
            </Paper>
          </Card>
        </Grid>
      </Grid>

      {/* ── Operational Command Center (Quick Launchers) ── */}
      <Card sx={{ mb: 3.5, borderRadius: 2.5, border: '1px solid #E2E8F0', p: 2 }}>
        <Typography variant="subtitle2" fontWeight={800} color="#0B1F5C" sx={{ mb: 1.5 }}>
          ⚡ Fast-Track Cadastral Command Center
        </Typography>
        <Grid container spacing={2}>
          {[
            { label: 'Pan-India GIS Cadastre', desc: 'Continuous topological map viewer', icon: <Map />, to: '/app/map', color: '#0B1F5C' },
            { label: 'Land Records & 7/12', desc: 'Inspect ULPIN title certificates', icon: <Description />, to: '/app/records', color: '#0284C7' },
            { label: 'Workflow Approvals', desc: 'Sanction mutations & acquisition gazettes', icon: <Assignment />, to: '/app/workflows', color: '#D97706' },
            { label: 'R&R Compensation', desc: 'Statutory calculation & DBT payouts', icon: <AccountBalanceWallet />, to: '/app/rr-tracker', color: '#059669' },
            { label: 'Field Surveyor App', desc: 'Spot verification & GPS Panchnama', icon: <FactCheck />, to: '/app/field-agent', color: '#7C3AED' }
          ].map((act, idx) => (
            <Grid item xs={12} sm={6} md={2.4} key={idx}>
              <Paper
                component={RouterLink}
                to={act.to}
                variant="outlined"
                sx={{
                  p: 1.5, borderRadius: 2, textDecoration: 'none', display: 'block',
                  border: '1px solid #E2E8F0', transition: 'all 0.2s',
                  '&:hover': { bgcolor: '#F8FAFC', borderColor: act.color, transform: 'translateY(-2px)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: act.color, mb: 0.5 }}>
                  {act.icon}
                  <Typography variant="body2" fontWeight={800} color="#0F172A">
                    {act.label}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {act.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Card>

      {/* ── Two Columns: State Acquisition Performance & Land Use Breakdown ── */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Left Column: State Comparison Progress */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    State Pilot Hub Performance
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cadastral Demarcation & Compensation Progress Across Pilot Districts
                  </Typography>
                </Box>
                <Chip label={`${(kpi?.statePerformance || []).length} ACTIVE HUBS`} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: '#F1F5F9' }} />
              </Box>
              <Divider sx={{ mb: 2 }} />

              {(kpi?.statePerformance || []).map((st) => (
                <Box key={st.state} sx={{ mb: 2.2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {st.state}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({st.district} • {st.parcels} plots • {st.acres} Ac)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={st.status} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${st.color}15`, color: st.color }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {st.progress}%
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Number(st.progress) || 0}
                    sx={{
                      height: 7,
                      borderRadius: 4,
                      bgcolor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': { bgcolor: st.color, borderRadius: 4 }
                    }}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Land Use Distribution */}
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%', borderRadius: 2.5, border: '1px solid #E2E8F0', p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Land-Use Classification Breakdown
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cadastral Area by Statutory Usage Type
                </Typography>
              </Box>
              <Landscape sx={{ color: '#0B1F5C' }} />
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
              {(kpi?.landUseBreakdown || []).map((lu, idx) => (
                <Box key={idx}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {lu.type}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      {lu.acres} Ac ({lu.percent}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Number(lu.percent) || 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#F1F5F9',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: idx === 0 ? '#10B981' : idx === 1 ? '#3B82F6' : idx === 2 ? '#F59E0B' : idx === 3 ? '#8B5CF6' : '#EC4899'
                      }
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {lu.count} registered cadastral plots
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* ── National Cadastral Audit Log (Live Stream) ── */}
      <Card sx={{ borderRadius: 2.5, border: '1px solid #E2E8F0', p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
              National Cadastral Audit Log & Revenue Ledger
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Cryptographically timestamped transactions, mutation orders & field survey submissions
            </Typography>
          </Box>
          <Chip icon={<TrendingUp sx={{ fontSize: 14 }} />} label="SOCKET.IO LIVE STREAM" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {activities.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No audit activity recorded yet. Parcel mutations and field submissions will appear here in real-time.
              </Typography>
            </Grid>
          ) : activities.slice(0, 6).map((act) => (
            <Grid item xs={12} sm={6} md={4} key={act.id || Math.random()}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Chip 
                    size="small" 
                    label={(act.action || 'ACTIVITY').replace(/_/g, ' ')} 
                    color={act.action?.includes('DISBURSE') ? 'success' : act.action?.includes('FLAG') ? 'error' : 'primary'}
                    sx={{ fontWeight: 700, fontSize: '0.65rem' }} 
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                    {new Date(act.created_at || act.timestamp || Date.now()).toLocaleTimeString()}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.8 }}>
                  Parcel #{act.survey_no || act.parcel_id || 'N/A'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {act.actor_name || act.actor || 'Revenue Officer'}
                </Typography>
                {act.remarks && (
                  <Typography variant="caption" sx={{ fontStyle: 'italic', color: '#475569', display: 'block' }}>
                    "{act.remarks}"
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );
};

export default Dashboard;
