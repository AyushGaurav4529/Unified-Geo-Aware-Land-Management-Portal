import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, Typography, Grid, Stepper, Step, StepLabel, Button,
  Divider, Chip, TextField, FormControl, InputLabel, Select,
  MenuItem, Stack, Alert, Snackbar, Paper, CircularProgress,
  Tooltip, IconButton
} from '@mui/material';
import {
  CheckCircle, Cancel, Description, Print, Refresh,
  FilterList, Search, Gavel, VerifiedUser, Security,
  ArrowForward, Warning, DoneAll
} from '@mui/icons-material';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import LandPapersModal from '../components/LandPapersModal';

const PIPELINE_STEPS = [
  { label: 'DGPS Survey', desc: 'Boundary Demarcation & ULPIN' },
  { label: 'Sec 11 Notification', desc: 'Public Gazette Announcement' },
  { label: '7/12 & Title Audit', desc: 'Revenue Mutation Examination' },
  { label: 'Award Determination', desc: 'Market Valuation & Solatium' },
  { label: 'DBT Compensation', desc: 'PFMS Direct Benefit Transfer' }
];

function getStepFromStatus(status) {
  switch (status) {
    case 'Pending': return 0;
    case 'Under Acquisition': return 1;
    case 'Disputed': return 2;
    case 'Acquired': return 3;
    case 'Compensated': return 4;
    default: return 0;
  }
}

function getNextStatus(currentStatus) {
  switch (currentStatus) {
    case 'Pending': return 'Under Acquisition';
    case 'Under Acquisition': return 'Acquired';
    case 'Disputed': return 'Under Acquisition'; // Resolved back to acquisition
    case 'Acquired': return 'Compensated';
    case 'Compensated': return null;
    default: return 'Under Acquisition';
  }
}

const STATUS_CHIPS = {
  'Pending':           { label: '1. Pending Survey', bg: '#F1F5F9', color: '#475569', border: '#CBD5E1' },
  'Under Acquisition': { label: '2. Under Acquisition', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
  'Disputed':          { label: 'Grievance / Disputed', bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
  'Acquired':          { label: '4. Award Acquired', bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
  'Compensated':       { label: '5. Compensated (DBT)', bg: '#EFF6FF', color: '#1E40AF', border: '#93C5FD' },
};

const Workflows = () => {
  const { user } = useAuth();
  const isLocalAdmin = user && user.role !== 'Central Admin';
  const userState = (user && user.state && user.state !== 'National') ? user.state : 'ALL';
  const userDistrict = (user && user.district && user.district !== 'National') ? user.district : 'ALL';

  const [parcels, setParcels] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState(isLocalAdmin ? userState : 'ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [toast, setToast] = useState('');
  const [selectedDoc, setSelectedDoc] = useState({ open: false, parcel: null });
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchParcels = useCallback(async () => {
    setLoading(true);
    try {
      const effState = isLocalAdmin ? userState : stateFilter;
      const effDistrict = isLocalAdmin ? userDistrict : 'ALL';
      const qParams = new URLSearchParams();
      if (effState !== 'ALL') qParams.append('state', effState);
      if (effDistrict !== 'ALL') qParams.append('district', effDistrict);
      const qStr = qParams.toString() ? `?${qParams.toString()}` : '';

      const res = await fetch(`http://localhost:5000/api/parcels${qStr}`);
      const data = await res.json();
      const list = data.features.map(f => ({
        id: f.properties.id,
        geometry: f.geometry,
        ...f.properties
      }));
      setParcels(list);
      applyFilter(list, search, effState, statusFilter);
    } catch (err) {
      console.error('Error fetching parcels for workflow:', err);
    } finally {
      setLoading(false);
    }
  }, [search, stateFilter, statusFilter, isLocalAdmin, userState, userDistrict]);

  const applyFilter = (dataList, q, state, status) => {
    let result = dataList;
    if (state !== 'ALL') {
      result = result.filter(p => p.state?.toLowerCase() === state.toLowerCase());
    }
    if (isLocalAdmin && userDistrict !== 'ALL') {
      result = result.filter(p => p.district?.toLowerCase() === userDistrict.toLowerCase());
    }
    if (status !== 'ALL') {
      result = result.filter(p => p.status === status);
    }
    if (q.trim()) {
      const lower = q.toLowerCase().trim();
      result = result.filter(p =>
        p.land_name?.toLowerCase().includes(lower) ||
        p.survey_no?.toLowerCase().includes(lower) ||
        p.ulpin?.toLowerCase().includes(lower) ||
        p.owner_name?.toLowerCase().includes(lower) ||
        p.village?.toLowerCase().includes(lower) ||
        p.district?.toLowerCase().includes(lower)
      );
    }
    setFiltered(result);
  };

  useEffect(() => {
    fetchParcels();

    // Real-time synchronization across all screens
    const socket = getSocket();
    const onParcelUpdated = ({ feature, log }) => {
      setParcels(prev => {
        const next = prev.map(p => p.id === feature.id ? { id: feature.id, geometry: feature.geometry, ...feature.properties } : p);
        applyFilter(next, search, stateFilter, statusFilter);
        return next;
      });
      // Update currently viewed modal if open
      setSelectedDoc(cur => cur.open && cur.parcel?.id === feature.id ? { open: true, parcel: { id: feature.id, ...feature.properties } } : cur);
    };

    socket.on('parcel_updated', onParcelUpdated);
    return () => {
      socket.off('parcel_updated', onParcelUpdated);
    };
  }, [fetchParcels, search, stateFilter, statusFilter]);

  // Handle Approve & Advance button action
  const handleApprove = async (parcel) => {
    const next = getNextStatus(parcel.status);
    if (!next) return;

    setActionLoadingId(parcel.id);
    try {
      const res = await fetch(`http://localhost:5000/api/parcels/${parcel.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: next,
          actor: 'Revenue Competent Authority (CALA)'
        })
      });
      if (res.ok) {
        setToast(`✅ Advanced ${parcel.land_name || parcel.survey_no}: ${parcel.status} → ${next}`);
      }
    } catch (err) {
      console.error('Failed to advance workflow status:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject / Raise Dispute action
  const handleReject = async (parcel) => {
    setActionLoadingId(parcel.id);
    try {
      const res = await fetch(`http://localhost:5000/api/parcels/${parcel.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Disputed',
          actor: 'Revenue Land Audit Grievance Cell'
        })
      });
      if (res.ok) {
        setToast(`⚠️ Flagged ${parcel.land_name || parcel.survey_no} as Disputed`);
      }
    } catch (err) {
      console.error('Failed to reject workflow:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    applyFilter(parcels, val, stateFilter, statusFilter);
  };

  const handleStateChange = (e) => {
    const s = e.target.value;
    setStateFilter(s);
    applyFilter(parcels, search, s, statusFilter);
  };

  const handleStatusChange = (e) => {
    const st = e.target.value;
    setStatusFilter(st);
    applyFilter(parcels, search, stateFilter, st);
  };

  // Summary counts
  const pendingCount     = parcels.filter(p => p.status === 'Pending').length;
  const underAcqCount    = parcels.filter(p => p.status === 'Under Acquisition').length;
  const disputedCount    = parcels.filter(p => p.status === 'Disputed').length;
  const acquiredCount    = parcels.filter(p => p.status === 'Acquired').length;
  const compensatedCount = parcels.filter(p => p.status === 'Compensated').length;

  return (
    <Box sx={{ p: 1 }}>
      {/* ── Page Title & Metrics Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Plus Jakarta Sans', color: '#0F172A' }}>
            Statutory Land Acquisition Workflow Approvals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live RFCTLARR Act 2013 Milestone Enforcement • Synchronized with Land Records Master & Cadastral Map
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchParcels}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Refresh Pipeline
          </Button>
        </Stack>
      </Box>

      {/* ── KPI Pipeline Overview Strip ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Pending Survey', count: pendingCount, color: '#475569', bg: '#F8FAFC' },
          { label: 'Under Acquisition', count: underAcqCount, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Disputed / In Review', count: disputedCount, color: '#DC2626', bg: '#FEF2F2' },
          { label: 'Award Acquired', count: acquiredCount, color: '#059669', bg: '#ECFDF5' },
          { label: 'DBT Compensated', count: compensatedCount, color: '#2563EB', bg: '#EFF6FF' }
        ].map((kpi, idx) => (
          <Grid item xs={6} sm={4} md={2.4} key={idx}>
            <Card sx={{ p: 1.8, bgcolor: kpi.bg, border: '1px solid #E2E8F0', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: kpi.color, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
                {kpi.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.3 }}>
                {kpi.count}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Search & Filter Controls ── */}
      <Card sx={{ mb: 3, p: 2, borderRadius: 2.5, border: '1px solid #E2E8F0', bgcolor: '#F8FAFC' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Search by Land Name, Survey No, ULPIN, Village, or Owner..."
            value={search}
            onChange={handleSearchChange}
            sx={{ bgcolor: 'white', borderRadius: 2 }}
          />

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>State Cadastre Hub</InputLabel>
            <Select
              value={isLocalAdmin ? userState : stateFilter}
              label="State Cadastre Hub"
              onChange={handleStateChange}
              disabled={isLocalAdmin}
              sx={{ bgcolor: 'white', fontWeight: 600 }}
            >
              {isLocalAdmin ? (
                <MenuItem value={userState}>{userState} Jurisdiction</MenuItem>
              ) : (
                [
                  <MenuItem key="ALL" value="ALL">All India (8 States)</MenuItem>,
                  <MenuItem key="KA" value="Karnataka">Karnataka (Tumkur)</MenuItem>,
                  <MenuItem key="MH" value="Maharashtra">Maharashtra (Pune)</MenuItem>,
                  <MenuItem key="UP" value="Uttar Pradesh">Uttar Pradesh (Varanasi)</MenuItem>,
                  <MenuItem key="GJ" value="Gujarat">Gujarat (Ahmedabad)</MenuItem>,
                  <MenuItem key="TN" value="Tamil Nadu">Tamil Nadu (Coimbatore)</MenuItem>,
                  <MenuItem key="RJ" value="Rajasthan">Rajasthan (Jaipur)</MenuItem>,
                  <MenuItem key="WB" value="West Bengal">West Bengal (Hooghly)</MenuItem>,
                  <MenuItem key="PB" value="Punjab">Punjab (Ludhiana)</MenuItem>
                ]
              )}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Workflow Stage</InputLabel>
            <Select
              value={statusFilter}
              label="Workflow Stage"
              onChange={handleStatusChange}
              sx={{ bgcolor: 'white', fontWeight: 600 }}
            >
              <MenuItem value="ALL">All Stages ({parcels.length})</MenuItem>
              <MenuItem value="Pending">Pending ({pendingCount})</MenuItem>
              <MenuItem value="Under Acquisition">Under Acquisition ({underAcqCount})</MenuItem>
              <MenuItem value="Disputed">Disputed ({disputedCount})</MenuItem>
              <MenuItem value="Acquired">Acquired ({acquiredCount})</MenuItem>
              <MenuItem value="Compensated">Compensated ({compensatedCount})</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card>

      {/* ── Active Workflow Cases List ── */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.slice(0, 30).map(parcel => {
            const currentStep = getStepFromStatus(parcel.status);
            const isDisputed  = parcel.status === 'Disputed';
            const isCompleted = parcel.status === 'Compensated';
            const sc          = STATUS_CHIPS[parcel.status] || STATUS_CHIPS['Pending'];
            const nextStatus  = getNextStatus(parcel.status);
            const isBusy      = actionLoadingId === parcel.id;

            return (
              <Grid item xs={12} lg={6} key={parcel.id}>
                <Card sx={{ p: 2.8, borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  
                  {/* Card Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0B1F5C', lineHeight: 1.2 }}>
                          {parcel.land_name || `Survey #${parcel.survey_no}`}
                        </Typography>
                        <Chip
                          label={sc.label}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Survey: <strong>{parcel.survey_no}</strong> • ULPIN: <strong>{parcel.ulpin}</strong> • {parcel.village} Village, {parcel.district} ({parcel.state_code})
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Description />}
                      onClick={() => setSelectedDoc({ open: true, parcel })}
                      sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', borderRadius: 1.5, whiteSpace: 'nowrap' }}
                    >
                      Land Papers (6)
                    </Button>
                  </Box>

                  {/* Owner and Land Metadata Strip */}
                  <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0', mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                        Sole Titleholder (1 Land = 1 Person Verified):
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {parcel.owner_name} <span style={{ fontWeight: 500, color: '#64748B' }}>({parcel.owner_relation})</span>
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                        Measurement & Cadastre:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#059669' }}>
                        {parcel.area_acres} Acres • {parcel.area_local}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Grievance Warning if Disputed */}
                  {isDisputed && (
                    <Alert severity="error" icon={<Warning />} sx={{ mb: 2, py: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
                      Grievance under review: Title dispute or boundary discrepancy flagged. Click "Approve & Advance" once rectified.
                    </Alert>
                  )}

                  {/* Interactive RFCTLARR Stepper */}
                  <Box sx={{ my: 'auto', py: 1 }}>
                    <Stepper activeStep={currentStep} alternativeLabel>
                      {PIPELINE_STEPS.map((step, idx) => {
                        const stepError = isDisputed && idx === 2;
                        return (
                          <Step key={step.label} completed={!isDisputed && currentStep > idx}>
                            <StepLabel error={stepError}>
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', display: 'block' }}>
                                {step.label}
                              </Typography>
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', color: '#64748B' }}>
                                {step.desc}
                              </Typography>
                            </StepLabel>
                          </Step>
                        );
                      })}
                    </Stepper>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Action Buttons: Synchronized with Backend & Land Records Master */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Last Updated: {new Date(parcel.last_updated || Date.now()).toLocaleTimeString()}
                    </Typography>

                    <Stack direction="row" spacing={1.5}>
                      {/* Reject / Dispute Button */}
                      {!isCompleted && !isDisputed && (
                        <Button
                          color="error"
                          variant="outlined"
                          size="small"
                          disabled={isBusy}
                          onClick={() => handleReject(parcel)}
                          startIcon={<Cancel />}
                          sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5, fontSize: '0.75rem' }}
                        >
                          Reject / Dispute
                        </Button>
                      )}

                      {/* Approve & Advance Button */}
                      {isCompleted ? (
                        <Chip
                          icon={<DoneAll />}
                          label="100% Compensated & Closed"
                          color="success"
                          sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                        />
                      ) : (
                        <Button
                          variant="contained"
                          size="small"
                          disabled={isBusy}
                          onClick={() => handleApprove(parcel)}
                          endIcon={isBusy ? <CircularProgress size={14} color="inherit" /> : <ArrowForward />}
                          sx={{
                            bgcolor: isDisputed ? '#D97706' : '#0B1F5C',
                            color: 'white',
                            textTransform: 'none',
                            fontWeight: 800,
                            borderRadius: 1.5,
                            fontSize: '0.75rem',
                            '&:hover': { bgcolor: isDisputed ? '#B45309' : '#1E3A8A' }
                          }}
                        >
                          {isDisputed ? 'Resolve & Advance' : `Approve → ${nextStatus}`}
                        </Button>
                      )}
                    </Stack>
                  </Box>
                </Card>
              </Grid>
            );
          })}

          {filtered.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
                <Typography color="text.secondary" sx={{ fontWeight: 600 }}>
                  No land workflow cases found matching the filter criteria.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* ── Certified Land Papers Modal with Print Support ── */}
      <LandPapersModal
        open={selectedDoc.open}
        onClose={() => setSelectedDoc({ open: false, parcel: null })}
        parcel={selectedDoc.parcel}
      />

      {/* ── Toast Notification ── */}
      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ fontWeight: 700, borderRadius: 2 }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Workflows;
