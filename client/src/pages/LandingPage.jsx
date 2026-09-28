import React from 'react';
import { Box, Typography, Button, Container, Grid, Card, CardContent, Chip, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { Public, Speed, AccountBalance, TrendingUp, Group, Build } from '@mui/icons-material';

const LandingPage = () => {
  return (
    <Box>
      {/* 1. Hero Section */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Chip label="SIH 2026 | Team Yaps-Coder | SIH26016" color="warning" sx={{ mb: 3, fontWeight: 'bold' }} />
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800 }}>
            Unified Geo-Aware Land Management Portal
          </Typography>
          <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
            "One Map | One System | Transparent Land Governance"
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" color="secondary" size="large" component={RouterLink} to="/transparency" sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}>
              Explore Live Map
            </Button>
            <Button variant="outlined" color="inherit" size="large" component={RouterLink} to="/login" sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}>
              Officer Login
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* 2. The Problem We Solve */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom sx={{ fontWeight: 700, mb: 6 }}>
          The Problem We Solve
        </Typography>
        <Grid container spacing={4}>
          {[
            { title: 'Fragmented Portals', desc: 'Multiple incompatible state systems create silos.' },
            { title: 'Manual Processes', desc: 'Paper-based physical files are prone to loss and delays.' },
            { title: 'Slow Approvals', desc: 'Lack of tracking leads to massive bottlenecks in acquisition.' },
            { title: 'No National Visibility', desc: 'The center lacks a unified view of real-time project statuses.' }
          ].map((item, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{item.title}</Typography>
                  <Typography variant="body2">{item.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 3. The Solution Pillars */}
      <Box sx={{ bgcolor: 'background.default', py: 8 }}>
        <Container>
          <Typography variant="h3" textAlign="center" gutterBottom sx={{ fontWeight: 700, mb: 6 }}>
            Our Three Pillars
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <Public sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>Accurate & Reliable</Typography>
                <Typography variant="body1" color="text.secondary">
                  PostGIS Engine with boundary locking prevents disputes and overlapping claims.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <TrendingUp sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>Proactive Governance</Typography>
                <Typography variant="body1" color="text.secondary">
                  Predictive Analytics flags early delays based on historical workflow data.
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <Group sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>People-Centric</Typography>
                <Typography variant="body1" color="text.secondary">
                  R&R Tracker ensures real-time compensation disbursement for displaced families.
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 4. How it Works */}
      <Container sx={{ py: 8 }}>
        <Typography variant="h3" textAlign="center" gutterBottom sx={{ fontWeight: 700, mb: 6 }}>
          How It Works
        </Typography>
        <Grid container spacing={2}>
          {['Data Capture (Mobile/Web)', 'Verification (PostGIS Checks)', 'Processing & Approval (RBAC)', 'Secure Storage (AWS S3)', 'Dashboard Monitoring', 'Public Transparency'].map((step, i) => (
            <Grid item xs={12} sm={4} md={2} key={i}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', mb: 2, fontWeight: 'bold' }}>
                  {i + 1}
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{step}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
      
      {/* 5. Feasibility & Impact */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 8 }}>
        <Container>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" gutterBottom>High Feasibility</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Technical:</strong> Microservices, PostGIS, React.<br/>
                <strong>Operational:</strong> Matches existing govt hierarchy via RBAC.<br/>
                <strong>Economic:</strong> Built on open-source (PostgreSQL/Leaflet), ready for AWS Free Tier.
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 3, fontWeight: 'bold' }}>Challenges Solved:</Typography>
              <ul>
                <li>Legacy Fragmentation → Modular API Gateway</li>
                <li>Poor Rural Connectivity → Offline-First Mobile App</li>
                <li>Data Security → Multi-tenancy & Audit Trails</li>
              </ul>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h4" gutterBottom>Measurable Impact</Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6}><Typography variant="h3" color="warning.main">50%</Typography> Time Reduction</Grid>
                <Grid item xs={6}><Typography variant="h3" color="success.main">100%</Typography> Data Visibility</Grid>
                <Grid item xs={6}><Typography variant="h3" color="secondary.light">3x</Typography> User Engagement</Grid>
              </Grid>
              <Typography variant="h6" gutterBottom>Scalability Roadmap:</Typography>
              <Typography variant="body2">Pilot (1 District) → State Rollout → National Adoption → Global Potential</Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 6. Built on National Initiatives */}
      <Container sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>Built Aligning With National Initiatives</Typography>
        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" useFlexGap>
          {['DILRMP', 'NGDRS', 'RFCTLARR Act 2013', 'PM Gati Shakti', 'Survey of India / NIC'].map((init) => (
            <Chip key={init} label={init} variant="outlined" color="primary" sx={{ m: 1, px: 2, py: 2, fontSize: '1rem' }} />
          ))}
        </Stack>
      </Container>

    </Box>
  );
};

export default LandingPage;
