import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontFamily: 'Plus Jakarta Sans', fontWeight: 700 }}>
            Unified Geo-Aware Land Management Portal
          </Typography>
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          <Button color="inherit" component={RouterLink} to="/transparency">Transparency Map</Button>
          <Button color="warning" variant="contained" component={RouterLink} to="/login" sx={{ ml: 2 }}>
            Officer Login
          </Button>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Outlet />
      </Box>
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: '#0B1F5C', color: 'white', textAlign: 'center' }}>
        <Typography variant="body2" sx={{ letterSpacing: 1, mb: 1 }}>
          LAND FOR A BETTER TOMORROW | DATA-DRIVEN | INCLUSIVE | TRANSPARENT
        </Typography>
        <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
          Team Yaps-Coder | Team ID 159287 | SIH 2026
        </Typography>
      </Box>
    </Box>
  );
};

export default PublicLayout;
