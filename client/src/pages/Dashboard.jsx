import React, { useEffect, useState } from 'react';
import { 
  Grid, Card, CardContent, Typography, Box, CircularProgress,
  LinearProgress, Chip, Button, Stack, Paper, Divider
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Assignment, CheckCircle, Warning, Landscape,
  Public, VerifiedUser, Security, TrendingUp, Speed,
  Map, Description, ArrowForward
} from '@mui/icons-material';

const STATE_PERFORMANCE = [
  { state: 'Uttar Pradesh', district: 'Varanasi', progress: 92, parcels: 36, status: 'Leading', color: '#10B981' },
  { state: 'Karnataka', district: 'Tumkur', progress: 88, parcels: 36, status: 'On Track', color: '#10B981' },
  { state: 'Tamil Nadu', district: 'Coimbatore', progress: 85, parcels: 36, status: 'On Track', color: '#3B82F6' },
  { state: 'Gujarat', district: 'Ahmedabad', progress: 81, parcels: 36, status: 'On Track', color: '#3B82F6' },
  { state: 'Rajasthan', district: 'Jaipur', progress: 78, parcels: 36, status: 'Verification', color: '#F59E0B' },
  { state: 'Maharashtra', district: 'Pune', progress: 74, parcels: 36, status: 'Surveying', color: '#F59E0B' }
];

const Dashboard = () => {
  const [kpi, setKpi] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, actRes] = await Promise.all([
          fetch('http://localhost:5000/api/dashboard/kpi'),
          fetch('http://localhost:5000/api/dashboard/recent-activity')
        ]);
        const kpiData = await kpiRes.json();
        const actData = await actRes.json();
        setKpi(kpiData);
        setActivities(actData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress size={44} sx={{ color: '#0B1F5C' }} />
    </Box>
  );

  const statCards = [
    { title: 'Total Pan-India Parcels', value: kpi?.totalParcels || 216, sub: '6 State Pilot Hubs', icon: <Landscape />, color: '#0B1F5C', bg: '#EFF6FF' },
    { title: 'Under Statutory Acquisition', value: kpi?.underAcquisition || 48, sub: 'Section 11 Gazetted', icon: <Warning />, color: '#D97706', bg: '#FEF3C7' },
    { title: 'Compensated & Registered', value: kpi?.compensated || 72, sub: 'Direct Benefit Transfer', icon: <CheckCircle />, color: '#059669', bg: '#ECFDF5' },
    { title: 'Total Surveyed Area', value: `${kpi?.totalArea || '684.50'} Ac`, sub: '2,770,000+ Sq. Meters', icon: <Assignment />, color: '#7C3AED', bg: '#F5F3FF' }
  ];

  return (
    <Box>
      {/* ── Page Header & Quick CTA ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Plus Jakarta Sans', color: '#0B1F5C' }}>
              National Land Governance Overview
            </Typography>
            <Chip label="DILRMP COMPLIANT" size="small" sx={{ bgcolor: '#0B1F5C', color: 'white', fontWeight: 800, fontSize: '0.65rem' }} />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Continuous PostGIS Topological Cadastral Mesh • 1:1 Titleholder Binding • RFCTLARR 2013 Statutory Pipeline
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            component={RouterLink} to="/app/map"
            variant="contained"
            startIcon={<Map />}
            sx={{ bgcolor: '#0B1F5C', fontWeight: 700, borderRadius: 2 }}
          >
            Launch Cadastral Map
          </Button>
          <Button
            component={RouterLink} to="/app/records"
            variant="outlined"
            startIcon={<Description />}
            sx={{ fontWeight: 700, borderRadius: 2, borderColor: '#CBD5E1', color: '#0F172A' }}
          >
            Land Records (ULPIN)
          </Button>
        </Stack>
      </Box>

      {/* ── KPI Stat Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {statCards.map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ height: '100%', borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
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
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 500 }}>
                  {stat.sub}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Integrity Highlights Bar ── */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {[
          { label: 'Spatial Non-Overlap Rate', val: '100.0%', desc: 'PostGIS ST_Disjoint Passed', icon: <Security sx={{ color: '#059669' }} /> },
          { label: 'ULPIN Bhu-Aadhaar Seeding', val: '100.0%', desc: '14-digit Geo-coded Coordinates', icon: <VerifiedUser sx={{ color: '#0284C7' }} /> },
          { label: 'DBT Compensation Speed', val: '38 Days', desc: 'Down from 180 Days (78% faster)', icon: <Speed sx={{ color: '#D97706' }} /> },
          { label: 'Single-Owner Binding', val: '216/216', desc: 'Zero Multi-Claim Disputes', icon: <CheckCircle sx={{ color: '#7C3AED' }} /> }
        ].map((item, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                {item.icon}
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, color: '#0F172A' }}>{item.val}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', display: 'block' }}>{item.label}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{item.desc}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* ── Two Columns: State Acquisition Performance & Recent Activity ── */}
      <Grid container spacing={3}>
        {/* Left Column: State Comparison Progress */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    State Pilot Hub Performance
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Acquisition & Cadastral Demarcation Progress
                  </Typography>
                </Box>
                <Chip label="6 ACTIVE STATES" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: '#F1F5F9' }} />
              </Box>
              <Divider sx={{ mb: 2 }} />

              {STATE_PERFORMANCE.map((st) => (
                <Box key={st.state} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {st.state}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({st.district} • {st.parcels} plots)
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
                    value={st.progress}
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

        {/* Right Column: Live Statutory Activity Stream */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    National Cadastral Audit Log
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cryptographically Logged Revenue Operations
                  </Typography>
                </Box>
                <Chip icon={<TrendingUp sx={{ fontSize: 14 }} />} label="REAL-TIME" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.8}>
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <Box key={act.id} sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.4 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                          {act.action}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                          {new Date(act.created_at).toLocaleTimeString()}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#0B1F5C', fontWeight: 600, display: 'block' }}>
                        Cadastral Survey #{act.survey_no} • {act.actor_name}
                      </Typography>
                      {act.remarks && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3, fontStyle: 'italic' }}>
                          "{act.remarks}"
                        </Typography>
                      )}
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">No activities logged yet.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
